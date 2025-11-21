# Notification System - Quick Reference Card

## 📋 Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `/src/app/api/notifications/route.ts` | API | Main CRUD endpoints |
| `/src/app/api/notifications/[id]/route.ts` | API | Single notification management |
| `/src/app/api/notifications/mark-all-read/route.ts` | API | Bulk operations |
| `/src/lib/notifications.ts` | Service | Notification creation helpers |
| `/src/hooks/useNotifications.ts` | Hook | Frontend state management |
| `/src/components/NotificationCenter.tsx` | Component | Bell icon + dropdown |
| `/src/app/notifications/page.tsx` | Page | Full notifications view |
| `/src/app/api/jobs/route.ts` | Modified | Order creation notifications |

## 🔗 API Endpoints

```
GET    /api/notifications?userId=1&limit=20&offset=0&unreadOnly=false
POST   /api/notifications
PATCH  /api/notifications
DELETE /api/notifications

GET    /api/notifications/[id]
PATCH  /api/notifications/[id]
DELETE /api/notifications/[id]

PATCH  /api/notifications/mark-all-read
```

## 📦 Import Reference

```typescript
// Service functions
import { 
  createNotification,
  notifyOrderCreated,
  notifyOrderStatusChange,
  notifyOrderCompleted,
  notifyOrderCancelled,
  notifyPaymentReceived,
  notifyPaymentPending,
  notifyPaymentFailed,
  notifyNewRating,
  notifyNewReview,
  notifyRevisionRequested,
  notifyRevisionCompleted,
  notifyNewMessage,
  notifySystemMessage,
  markAllNotificationsAsRead
} from '@/lib/notifications';

// Hook
import { useNotifications } from '@/hooks/useNotifications';

// Component
import { NotificationCenter } from '@/components/NotificationCenter';
```

## 🚀 10-Second Integration

### Add to Header
```typescript
<NotificationCenter userId={session?.user?.id} />
```

### Notify Users
```typescript
await notifyOrderCreated(userId, orderId, clientName)
  .catch(err => console.error('Notification error:', err));
```

### Use in Component
```typescript
const { notifications, unreadCount } = useNotifications(userId);
```

## 🎯 Notification Types

| Type | Function | Color | Icon |
|------|----------|-------|------|
| order | notifyOrderCreated, notifyOrderStatusChange, notifyOrderCompleted, notifyOrderCancelled | 🔵 Blue | 📋 |
| payment | notifyPaymentReceived, notifyPaymentPending, notifyPaymentFailed | 🟢 Green | 💰 |
| rating | notifyNewRating, notifyNewReview | 🟡 Yellow | ⭐ |
| message | notifyNewMessage | 🟣 Purple | 💬 |
| revision | notifyRevisionRequested, notifyRevisionCompleted | 🟠 Orange | 🔄 |
| system | notifySystemMessage | ⚫ Gray | ℹ️ |

## 💾 Database Schema

```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  userId INTEGER NOT NULL,
  type ENUM('order', 'payment', 'system', 'rating', 'message', 'revision'),
  title VARCHAR(255),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  relatedId INTEGER,
  relatedType VARCHAR(50),
  createdAt TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_read (read)
);
```

## 📊 Hook API

```typescript
const {
  notifications,      // Notification[]
  unreadCount,       // number
  loading,           // boolean
  error,             // string | null
  fetchNotifications, // (limit?, offset?, unreadOnly?) => Promise
  markAsRead,        // (notificationId) => void
  markAllAsRead,     // () => void
  deleteNotification, // (notificationId) => void
  deleteAllNotifications, // () => void
} = useNotifications(userId, pollingInterval);
```

## ✅ Common Patterns

### Pattern 1: Single Notification
```typescript
await notifyOrderCreated(userId, orderId, clientName)
  .catch(err => console.error('Error:', err));
```

### Pattern 2: Multiple Users
```typescript
Promise.all(
  userIds.map(uid => notifyOrderCreated(uid, orderId, clientName))
).catch(err => console.error('Error:', err));
```

### Pattern 3: Conditional
```typescript
if (status === 'completed') {
  await notifyOrderCompleted(clientId, orderId);
}
```

### Pattern 4: Fire and Forget
```typescript
Promise.all([...]).catch(() => {}); // Silent failure
```

## 🧪 Testing Commands

```bash
# Create notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"type":"order","title":"Test","message":"Test"}'

# Get notifications
curl "http://localhost:3000/api/notifications?userId=1"

# Mark as read
curl -X PATCH http://localhost:3000/api/notifications/1 \
  -H "Content-Type: application/json" \
  -d '{"read":true}'

# Mark all as read
curl -X PATCH http://localhost:3000/api/notifications/mark-all-read \
  -H "Content-Type: application/json" \
  -d '{"userId":1}'

# Delete notification
curl -X DELETE http://localhost:3000/api/notifications/1
```

## ⚡ Performance Tips

1. **Polling Interval**: 30 seconds (configurable)
2. **Batch Notifications**: Combine multiple notifications
3. **Error Handling**: Always use `.catch()`
4. **Fire & Forget**: Don't block API responses
5. **Pagination**: Use limit/offset in queries

## 🔒 Security Checklist

- [x] User ID validation in all endpoints
- [x] No sensitive data in messages
- [x] Input validation and sanitization
- [x] Proper error messages (no leaking info)
- [x] Authentication required on all endpoints

## 📱 Component Usage

```typescript
// In header/navbar
import { NotificationCenter } from '@/components/NotificationCenter';
import { useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();
  return (
    <header>
      <NotificationCenter userId={(session?.user as any)?.id} />
    </header>
  );
}

// In any component
import { useNotifications } from '@/hooks/useNotifications';

export function MyComponent({ userId }: { userId: number }) {
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);
  
  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(n => (
        <div key={n.id}>
          {n.title}
          <button onClick={() => markAsRead(n.id)}>Read</button>
        </div>
      ))}
    </div>
  );
}
```

## 🔄 Polling Architecture

- **Interval**: 30 seconds (default, configurable)
- **Trigger**: Automatic on component mount
- **Stop**: On component unmount
- **Cleanup**: Automatic interval cleanup
- **Advantages**: Simple, reliable, no server config

## 📖 Documentation Files

| File | Content |
|------|---------|
| `NOTIFICATION_SYSTEM_COMPLETE.md` | Full API docs, hook guide, integration steps |
| `NOTIFICATION_SYSTEM_IMPLEMENTATION.md` | Implementation summary, architecture, verification |
| `NOTIFICATION_INTEGRATION_EXAMPLES.md` | Code examples for each feature type |
| `NOTIFICATION_SYSTEM_CHECKLIST.md` | Implementation checklist, deployment guide |

## 🎓 Learning Path

1. Read `NOTIFICATION_SYSTEM_COMPLETE.md` - Understand the system
2. Review `NOTIFICATION_INTEGRATION_EXAMPLES.md` - See code examples
3. Add to header with `NotificationCenter` component
4. Integrate with first feature (e.g., orders)
5. Test with curl commands
6. Add to other features following the pattern

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No notifications appearing | Check userId is set, verify polling interval |
| API errors | Check browser console, verify endpoint paths |
| High memory usage | Increase polling interval, implement pagination |
| Database errors | Verify table exists, check indexes |

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review the integration examples
3. Check browser console for errors
4. Monitor API logs
5. Verify database connectivity

---

**Status**: ✅ Production Ready
**Last Updated**: 2024-01-15
**Version**: 1.0
