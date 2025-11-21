# 📢 NOTIFICATION INTEGRATION CHECKLIST

**Integrating Multi-Channel Notifications into All Status Update Routes**

---

## ✅ COMPLETED INTEGRATIONS

### Routes Already Updated with Notifications

#### 1. ✅ `src/app/api/jobs/[id]/status/route.ts`
**Status:** INTEGRATED

**What's there:**
- ✅ In-app notifications to all parties
- ✅ Multi-channel call to `notifyStatusChange()` function
- ✅ Import added: `import { notifyStatusChange } from './notify-status-change/route';`
- ✅ Call location: After basic in-app notifications block

**Code:**
```typescript
// Send comprehensive multi-channel notifications
try {
  await notifyStatusChange(jobId, oldStatus, status);
} catch (multiChannelError) {
  console.error('Failed to send multi-channel notifications:', multiChannelError);
}
```

---

#### 2. ✅ `src/app/api/editor/[id]/approve/route.ts`
**Status:** INTEGRATED

**What's there:**
- ✅ In-app notification created for client
- ✅ Multi-channel call to notification endpoint
- ✅ Proper error handling with try-catch

**Code:**
```typescript
// Create in-app notification for client
await db.insert(notifications).values({
  userId: job[0].clientId as number,
  jobId: jobId,
  type: 'editor_approved',
  title: 'Work Quality Approved',
  message: `The editor has approved your order...`,
});

// Send multi-channel notifications
const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
  method: 'POST',
  body: JSON.stringify({ oldStatus, newStatus: 'delivered' }),
});
```

---

#### 3. ✅ `src/app/api/manager/[id]/approve-submission/route.ts`
**Status:** INTEGRATED

**What's there:**
- ✅ In-app notification created for freelancer
- ✅ Multi-channel call to notification endpoint
- ✅ Conditional messaging for approve vs reject

**Code:**
```typescript
// Create notification for freelancer
await db.insert(notifications).values({
  userId: job[0].assignedFreelancerId,
  type: 'manager_approved',
  title: 'Manager Approved Your Work',
  message: sendToEditor ? 'in quality review' : 'returning for changes',
});

// Send multi-channel
await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
  method: 'POST',
  body: JSON.stringify({ oldStatus, newStatus: nextStatus }),
});
```

---

## 📋 ROUTES NEEDING INTEGRATION

### Priority 1: Critical Status Updates

#### Route: `src/app/api/jobs/[id]/submit/route.ts`
**Status:** ❌ NEEDS INTEGRATION
**When:** Freelancer submits work
**Current Status:** in_progress
**Notify:** Client (work submitted), Manager, Admin

**Integration Template:**
```typescript
// After work is submitted and status set to 'submitted' or 'in_progress'
const oldStatus = 'in_progress';
const newStatus = 'in_progress'; // Or 'submitted' if that's your status

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send notifications:', notifyErr);
}
```

---

#### Route: `src/app/api/jobs/[id]/deliver/route.ts`
**Status:** ❌ NEEDS INTEGRATION
**When:** Freelancer/System marks work as delivered
**Current Status:** in_progress → delivered
**Notify:** Client, Manager, Admin, Freelancer

**Integration Template:**
```typescript
const oldStatus = job[0].status; // 'in_progress' or 'editing'
const newStatus = 'delivered';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send delivery notifications:', notifyErr);
}
```

---

#### Route: `src/app/api/jobs/[id]/approve-by-client/route.ts`
**Status:** ❌ NEEDS INTEGRATION
**When:** Client approves delivered work
**Current Status:** delivered → approved
**Notify:** Client, Freelancer, Manager, Admin

**Integration Template:**
```typescript
const oldStatus = 'delivered';
const newStatus = 'approved';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send approval notifications:', notifyErr);
}
```

---

#### Route: `src/app/api/jobs/[id]/request-revision/route.ts`
**Status:** ❌ NEEDS INTEGRATION
**When:** Client requests revision
**Current Status:** delivered → revision
**Notify:** Client, Freelancer, Manager, Admin

**Integration Template:**
```typescript
const oldStatus = 'delivered';
const newStatus = 'revision';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send revision notification:', notifyErr);
}
```

---

### Priority 2: Editor Routes

#### Route: `src/app/api/editor/[id]/reject/route.ts`
**Status:** ❌ NEEDS INTEGRATION
**When:** Editor rejects work for revision
**Current Status:** editing → in_progress
**Notify:** Freelancer, Manager, Client, Admin

**Integration Template:**
```typescript
const oldStatus = 'editing';
const newStatus = 'in_progress';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send rejection notifications:', notifyErr);
}
```

---

#### Route: `src/app/api/manager/[id]/approve-submission/route.ts` - PUT (Reject)
**Status:** ❌ NEEDS INTEGRATION (In POST, but also needed in PUT)
**When:** Manager rejects submission
**Current Status:** in_progress → in_progress (with revision notes)
**Notify:** Freelancer, Client, Admin

**Integration Template:**
```typescript
// In PUT handler for rejection
const oldStatus = 'in_progress';
const newStatus = 'in_progress';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      oldStatus, 
      newStatus,
      reason: rejectionReason // Add reason for context
    }),
  });
} catch (notifyErr) {
  console.error('Failed to send rejection notifications:', notifyErr);
}
```

---

### Priority 3: Payment Routes

#### Route: `src/app/api/payments/[id]/confirm/route.ts`
**Status:** ❌ NEEDS INTEGRATION
**When:** Payment confirmed and job moves to 'paid'
**Current Status:** approved → paid
**Notify:** Client, Freelancer, Manager, Admin

**Integration Template:**
```typescript
// After payment is confirmed
const oldStatus = 'approved';
const newStatus = 'paid';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send payment notifications:', notifyErr);
}
```

---

#### Route: `src/app/api/jobs/[id]/complete/route.ts` (if exists)
**Status:** ❌ NEEDS INTEGRATION (or check if in status/route.ts)
**When:** Order marked as completed
**Current Status:** paid → completed
**Notify:** All parties with final confirmation

**Integration Template:**
```typescript
const oldStatus = 'paid';
const newStatus = 'completed';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send completion notifications:', notifyErr);
}
```

---

### Priority 4: Cancellation & Hold Routes

#### Route: Any route that sets status to 'cancelled'
**Status:** ❌ NEEDS INTEGRATION
**When:** Order cancelled (by any user)
**Notify:** All parties about cancellation

**Integration Template:**
```typescript
const oldStatus = job[0].status;
const newStatus = 'cancelled';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send cancellation notifications:', notifyErr);
}
```

---

#### Route: Any route that sets status to 'on_hold'
**Status:** ❌ NEEDS INTEGRATION
**When:** Order put on hold
**Notify:** Client, Freelancer, Manager

**Integration Template:**
```typescript
const oldStatus = job[0].status;
const newStatus = 'on_hold';

try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send hold notifications:', notifyErr);
}
```

---

## 🔍 DISCOVERY: FIND ALL STATUS UPDATE ROUTES

**Commands to find routes that change job status:**

```bash
# Search for status updates across all routes
grep -r "status.*=" src/app/api --include="*.ts" | grep -v "node_modules"

# Specifically look for PATCH/PUT/POST operations
grep -r "PATCH\|PUT\|POST" src/app/api/jobs --include="route.ts" | head -20

# Find all places where we update jobs table
grep -r "db.update(jobs)" src/app/api --include="*.ts"

# Find all job status values being set
grep -r "status.*:.*['\"]" src/app/api/jobs --include="*.ts" | grep -v "VALID_STATUSES"
```

---

## 📝 IMPLEMENTATION PATTERN

**Standard pattern for all notifications:**

```typescript
// 1. Import notifications (if not already imported)
import { notifications } from '@/db/schema';

// 2. Save old status before update
const oldStatus = job[0].status;

// 3. Update job status
await db.update(jobs).set({
  status: newStatus,
  updatedAt: new Date().toISOString(),
}).where(eq(jobs.id, jobId));

// 4. Create in-app notification (if needed)
try {
  await db.insert(notifications).values({
    userId: targetUserId,
    jobId: jobId,
    type: 'order_updated',
    title: 'Status Updated',
    message: 'Your order status has changed',
    read: false,
    createdAt: new Date().toISOString(),
  });
} catch (notifErr) {
  console.error('Failed to create in-app notification:', notifErr);
}

// 5. Send multi-channel notifications
try {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStatus, newStatus }),
  });
} catch (notifyErr) {
  console.error('Failed to send multi-channel notifications:', notifyErr);
  // Don't fail the main operation if notifications fail
}

// 6. Return response
return NextResponse.json({
  success: true,
  message: 'Status updated',
  jobId,
  status: newStatus,
});
```

---

## ✨ BEST PRACTICES

### Do's:
- ✅ Always save `oldStatus` before updating
- ✅ Always wrap notification calls in try-catch
- ✅ Don't fail the main operation if notifications fail
- ✅ Use consistent error logging format
- ✅ Include jobId and status in all notification calls
- ✅ Use environment variable `NEXT_PUBLIC_BASE_URL` for fetch URLs

### Don'ts:
- ❌ Don't block the main response on notifications
- ❌ Don't repeat notification code - use the utility function
- ❌ Don't forget to pass both oldStatus and newStatus
- ❌ Don't assume notifications will always succeed
- ❌ Don't create multiple notifications for same status change

---

## 🧪 TESTING NOTIFICATIONS

### Test Complete Flow
```bash
# 1. Create a job
POST /api/jobs
{
  "clientId": 100,
  "title": "Test essay",
  "pages": 5
}
# Note the jobId

# 2. Update status multiple times
PATCH /api/jobs/{jobId}/status
{ "status": "accepted" }

# 3. Check notifications were created
GET /api/notifications?userId=100
# Should see status update notification

# 4. Check notification endpoint was called
# (Monitor server logs or check email/SMS delivery)
```

### Verify Multi-Channel Delivery
```
✅ Check database: notifications table has record
✅ Check email: Recipient received status update email
✅ Check WhatsApp: Message arrived (if WhatsApp enabled)
✅ Check Telegram: Admin received alert (if critical status)
```

---

## 📊 STATUS MATRIX

| Route | File | Status | Priority |
|-------|------|--------|----------|
| POST /api/jobs/[id]/submit | submit/route.ts | ❌ TODO | P1 |
| PATCH /api/jobs/[id]/status | status/route.ts | ✅ DONE | P1 |
| POST /api/jobs/[id]/deliver | deliver/route.ts | ❌ TODO | P1 |
| POST /api/jobs/[id]/approve-by-client | approve-by-client/route.ts | ❌ TODO | P1 |
| POST /api/jobs/[id]/request-revision | request-revision/route.ts | ❌ TODO | P1 |
| POST /api/editor/[id]/approve | editor/.../approve/route.ts | ✅ DONE | P2 |
| POST /api/editor/[id]/reject | editor/.../reject/route.ts | ❌ TODO | P2 |
| POST /api/manager/[id]/approve-submission | manager/.../approve-submission/route.ts | ✅ DONE (POST) | P2 |
| PUT /api/manager/[id]/approve-submission | manager/.../approve-submission/route.ts | ❌ TODO (PUT) | P2 |
| POST /api/payments/[id]/confirm | payments/.../confirm/route.ts | ❌ TODO | P3 |

---

## 🚀 INTEGRATION PRIORITY ORDER

1. **Phase 1 (Critical):**
   - deliver/route.ts
   - approve-by-client/route.ts
   - request-revision/route.ts

2. **Phase 2 (High):**
   - submit/route.ts
   - editor reject/route.ts
   - manager approval PUT (reject)

3. **Phase 3 (Medium):**
   - payments confirm/route.ts
   - completion/route.ts (if exists)
   - cancellation routes

---

## 📞 SUPPORT

If a route doesn't have notifications:
1. Check if it updates job status
2. If yes, add the integration using the template above
3. Test with test database first
4. Verify notifications are sent via logs/email
5. Deploy to production

**Last Updated:** November 21, 2025  
**Integration Status:** 3 of 9 critical routes done (33%)