# IMPLEMENTATION CHECKLIST - ORDER WORKFLOW BUTTONS

## 🎯 Critical Implementation Tasks

### 1. Manager/Admin Order Pages - "Accept" Button (PENDING → ACCEPTED)

**Location**: `/src/app/manager/orders/[id]/page.tsx` and `/src/app/admin/jobs/[id]/page.tsx`

**Logic**:
- Show ONLY when `order.status === "pending"`
- Button: "✅ Accept Order"
- API Call: `POST /api/jobs/[id]/accept`
- Updates: `status` → "accepted"
- Notification: Send to client (order accepted)

**API Endpoint Needed**:
```
POST /api/jobs/[id]/accept
{
  "managerId": number (current user id)
}
Response:
{
  "success": true,
  "job": { ...updated job with status: "accepted" }
}
```

---

### 2. Manager/Admin Order Pages - "Assign Freelancer" Button (ACCEPTED → ASSIGNED)

**Location**: `/src/app/manager/orders/[id]/page.tsx` and `/src/app/admin/jobs/[id]/page.tsx`

**Logic**:
- Show ONLY when `order.status === "accepted"`
- Button: "👤 Assign Freelancer"
- Opens Dialog with Freelancer Selection
- API Call: `POST /api/jobs/[id]/assign`
- Updates: `status` → "assigned" or "in_progress", `assignedFreelancerId` set
- Notification: Send to freelancer (work assigned)

**API Endpoint Needed**:
```
POST /api/jobs/[id]/assign
{
  "freelancerId": number,
  "managerId": number
}
Response:
{
  "success": true,
  "job": { ...updated job with assignedFreelancerId and status: "assigned" }
}
```

---

### 3. Freelancer Order Pages - Upload & Submit Buttons (ASSIGNED → EDITING)

**Location**: `/src/app/freelancer/orders/[id]/page.tsx`

**Logic**:
- Show ONLY when `order.status === "assigned"` or `"in_progress"`
- Buttons:
  - 📤 "Upload Draft" → upload with type="draft"
  - 📤 "Upload Final" → upload with type="final"
  - 📝 "Upload Reports" → reminder message (NOT uploading yet)
  - ✅ "Submit Files" → moves to "editing" status
- File uploads group by type (draft, final, revision)
- Reports reminder: "Don't forget to attach reports to your submission!"

**File Upload Structure**:
```
{
  "type": "draft" | "final" | "revision",
  "files": [...],
  "requiresReports": true
}
```

**API Endpoint Needed**:
```
POST /api/jobs/[id]/submit
{
  "freelancerId": number,
  "submissionType": "final",
  "hasReports": boolean
}
Response:
{
  "success": true,
  "job": { ...updated job with status: "editing", finalSubmissionComplete: true }
}
```

---

### 4. Client Order Pages - "Request Revision" Button (ANY DELIVERY STAGE)

**Location**: `/src/app/client/jobs/[id]/page.tsx`

**Logic**:
- Show when `order.status === "delivered"` or `"editing"`
- Button: "🔄 Request Revision"
- Opens Dialog with Revision Notes
- API Call: `POST /api/jobs/[id]/request-revision`
- Updates: `status` → "revision", `revisionRequested` → true
- Auto-Notifications: All users notified immediately
- Freelancer: Direct notification (highlighted)

**API Endpoint Needed**:
```
POST /api/jobs/[id]/request-revision
{
  "clientId": number,
  "revisionNotes": string
}
Response:
{
  "success": true,
  "job": { ...updated job with status: "revision" },
  "notificationsSent": ["freelancer", "admin", "manager"]
}
```

---

### 5. Admin/Manager Order Pages - "Send Revision to Freelancer" Button (EDITING STAGE)

**Location**: `/src/app/manager/orders/[id]/page.tsx` and `/src/app/admin/jobs/[id]/page.tsx`

**Logic**:
- Show ONLY when `order.status === "editing"`
- Button: "🔄 Send Revision"
- Opens Dialog with Revision Instructions
- API Call: `POST /api/jobs/[id]/request-revision-from-admin`
- Updates: `status` → "revision", `revisionRequested` → true
- Notification: Send to Freelancer

**API Endpoint Needed**:
```
POST /api/jobs/[id]/request-revision-from-admin
{
  "managerId": number,
  "revisionNotes": string
}
Response:
{
  "success": true,
  "job": { ...updated job with status: "revision" }
}
```

---

## 📊 Database Changes Required

### orders/jobs Table Additions

```sql
-- Already exist (verify present):
ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN revisionRequested BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN revisionNotes TEXT;
ALTER TABLE jobs ADD COLUMN assignedFreelancerId INTEGER;
ALTER TABLE jobs ADD COLUMN managerId INTEGER;

-- NEW (if missing):
ALTER TABLE jobs ADD COLUMN finalSubmissionComplete BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN revisionSubmissionComplete BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN requiresReports BOOLEAN DEFAULT TRUE;
```

### File Upload Types

Verify order_files table can store uploadType:
```sql
-- Check if exists:
ALTER TABLE order_files ADD COLUMN upload_type TEXT DEFAULT 'additional';
-- Values: 'draft', 'final', 'revision', 'additional', 'report'
```

---

## 🔔 Notification Template

All revision/status changes should trigger:

```javascript
const notifyStatusChange = async (
  orderId: number,
  oldStatus: string,
  newStatus: string,
  changes: {
    revisonRequested?: boolean,
    assignedFreelancerId?: number,
    managerId?: number
  }
) => {
  // Notify affected users based on change type
  const usersToNotify = [];
  
  if (newStatus === 'revision') {
    // Notify freelancer, admin, manager, client
    usersToNotify.push(job.assignedFreelancerId, job.clientId, job.managerId);
  } else if (newStatus === 'accepted') {
    // Notify client
    usersToNotify.push(job.clientId);
  } else if (newStatus === 'assigned') {
    // Notify freelancer
    usersToNotify.push(job.assignedFreelancerId);
  }
  
  // Send notifications
  for (const userId of usersToNotify) {
    await createNotification({
      userId,
      type: 'order_status_changed',
      orderId,
      message: `Order ${oldStatus} → ${newStatus}`
    });
  }
};
```

---

## ✅ Testing Checklist

- [ ] Pending order: Manager can see "Accept" button
- [ ] Accepted order: Manager can see "Assign Freelancer" button
- [ ] Assigned order: Freelancer can see upload buttons
- [ ] After submission: Status changes to "editing"
- [ ] Editing stage: Manager sees "Send Revision" button
- [ ] Client can request revision from delivered orders
- [ ] Revision status triggers notifications to all users
- [ ] File uploads group correctly by type
- [ ] Reports reminder displays to freelancer
- [ ] All notifications are delivered to correct users

