# ORDER LIFECYCLE SYSTEM - COMPLETE IMPLEMENTATION

## ✅ IMPLEMENTATION STATUS: COMPLETE

This document provides comprehensive documentation for the complete order lifecycle system implemented across TaskLynk platform with proper backend logic, manager earnings tracking, writer earnings distribution, and order history logging.

---

## 📊 ORDER STATUS FLOW

```
Pending → Accepted → In Progress → Assigned → Editing → Delivered → Approved → Paid → Completed
                                                              ↓
                                                          Revision → (back to Editing)
                                                              
Alternative flows:
- Any status (except Completed/Paid) → On Hold → (back to previous status)
- Any status (except Completed/Paid) → Cancelled
```

---

## 🔄 COMPLETE STATUS LIFECYCLE

### ⭐ 1. PENDING
**Meaning**: Order created by client but not yet accepted by admin/manager.

**User Visibility**:
- **Client**: Sees "Pending" - Can edit/cancel order, upload files
- **Manager**: Sees "Pending" (only for assigned clients) - Can accept order
- **Writer**: Does NOT see pending orders
- **Admin**: Sees all "Pending" orders - Can accept and assign manager

**Allowed Actions**:
- Manager/Admin: Accept Order → POST /api/jobs/[id]/accept
- Admin: Cancel Order → POST /api/jobs/[id]/cancel
- Admin/Manager: Put On Hold → POST /api/jobs/[id]/hold

**Backend Logic**:
```sql
-- Status: 'pending'
-- No special processing required at creation
```

---

### ⭐ 2. ACCEPTED
**Meaning**: Admin/manager has accepted the order.

**User Visibility**:
- **Client**: Sees "In Progress" (client-facing mapping)
- **Manager**: Sees "Accepted" - Can assign writer
- **Writer**: Does not see yet
- **Admin**: Sees "Accepted" - Same actions as manager

**Allowed Actions**:
- Manager/Admin: Assign Writer → POST /api/jobs/[id]/assign

**Backend Logic**:
```sql
UPDATE jobs 
SET status='accepted', updated_at=NOW()
WHERE id=?

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, 'pending', 'accepted', ?, 'Order accepted', NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/accept`
```json
{
  "managerId": 123,  // or "adminId"
}
```

---

### ⭐ 3. IN PROGRESS
**Meaning**: Order is accepted and ready for writer assignment (transitional state).

**User Visibility**:
- **Client**: Shows "In Progress"
- **Manager**: Shows "In Progress" - Can assign writer
- **Writer**: Not visible unless assigned
- **Admin**: Same privileges as manager

**Note**: This is typically a transitional state between Accepted and Assigned.

---

### ⭐ 4. ASSIGNED
**Meaning**: Writer is officially assigned to the order.

**User Visibility**:
- **Client**: Still sees "In Progress" (client-facing mapping)
- **Manager**: Sees "Assigned"
- **Writer**: Sees order under "My Work → In Progress" - Can upload files
- **Admin**: Full visibility

**Allowed Actions**:
- Writer: Submit Work → POST /api/jobs/[id]/submit

**Backend Logic**:
```sql
UPDATE jobs 
SET status='assigned', assigned_freelancer_id=?, updated_at=NOW()
WHERE id=?

-- Manager earns KSh 10 for assignment
INSERT INTO manager_earnings(manager_id, job_id, earning_type, amount, created_at)
VALUES (?, ?, 'assign', 10, NOW())

UPDATE users 
SET balance = balance + 10, total_earned = total_earned + 10
WHERE id=? -- manager_id

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, 'accepted', 'assigned', ?, 'Writer assigned. Manager earned KSh 10', NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/assign` (Already exists)
```json
{
  "freelancerId": 456,
  "changedBy": 123
}
```

**Manager Earnings**: +10 KSh (flat fee for assignment)

---

### ⭐ 5. EDITING
**Meaning**: Writer has submitted work for the first time - under QA/review.

**User Visibility**:
- **Client**: Does NOT see "Editing" - still shows "In Progress"
- **Manager**: Sees "Editing" - Can review files, send to client or request revision
- **Writer**: Sees "Submitted/Editing"
- **Admin**: Can finalize or send revision

**Allowed Actions**:
- Manager: Deliver to Client → POST /api/jobs/[id]/deliver
- Manager/Admin: Request Revision (back to writer)

**Backend Logic**:
```sql
UPDATE jobs 
SET status='editing', updated_at=NOW()
WHERE id=?

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, 'assigned', 'editing', ?, 'Writer submitted draft', NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/submit` (Already exists)
- Writer must upload at least one FINAL file before submission
- Automatically moves status from 'assigned' to 'editing'

---

### ⭐ 6. ON HOLD
**Meaning**: Admin/Manager pauses order processing.

**User Visibility**:
- **All Users**: See "On Hold"

**Use Cases**:
- Client has not responded
- Payment delay
- System issue

**Backend Logic**:
```sql
UPDATE jobs 
SET status='on_hold'
WHERE id=?

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, ?, 'on_hold', ?, ?, NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/hold`
```json
{
  "managerId": 123,  // or "adminId"
  "reason": "Waiting for client response"
}
```

---

### ⭐ 7. DELIVERED
**Meaning**: Manager/Admin sends completed work to client.

**User Visibility**:
- **Client**: Sees "Delivered" - Gets Approve Order button, can request revision
- **Manager**: Sees "Delivered"
- **Writer**: Sees "Completed – Awaiting Client Approval"
- **Admin**: Can override or resend

**Allowed Actions**:
- Client: Approve Order → POST /api/jobs/[id]/approve-by-client
- Client: Request Revision → POST /api/jobs/[id]/request-revision

**Backend Logic**:
```sql
UPDATE jobs 
SET status='delivered', updated_at=NOW()
WHERE id=?

-- Manager earns: 10 + (5 × (pages-1))
DECLARE @manager_submit_pay = 10 + (5 * (pages - 1))

INSERT INTO manager_earnings(manager_id, job_id, earning_type, amount, created_at)
VALUES (?, ?, 'submit', @manager_submit_pay, NOW())

UPDATE users 
SET balance = balance + @manager_submit_pay, 
    total_earned = total_earned + @manager_submit_pay
WHERE id=? -- manager_id

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, 'editing', 'delivered', ?, CONCAT('Delivered to client. Manager earned KSh ', @manager_submit_pay), NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/deliver`
```json
{
  "managerId": 123
}
```

**Manager Earnings**: 10 + (5 × (pages-1)) KSh
- Example: 5 pages = 10 + (5 × 4) = 30 KSh
- Example: 1 page = 10 + (5 × 0) = 10 KSh

---

### ⭐ 8. APPROVED
**Meaning**: Client accepts the delivered work.

**User Visibility**:
- **Client**: Sees "Approved" - Order locked from further revision
- **Manager**: Sees "Approved"
- **Writer**: Sees "Approved – Awaiting Payment"
- **Admin**: Sees confirm payment button

**Allowed Actions**:
- Admin: Confirm Payment → POST /api/jobs/[id]/confirm-payment

**Backend Logic**:
```sql
UPDATE jobs 
SET status='approved', client_approved=1, updated_at=NOW()
WHERE id=?

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, 'delivered', 'approved', ?, 'Client approved order', NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/approve-by-client`
```json
{
  "clientId": 789
}
```

---

### ⭐ 9. REVISIONS
**Meaning**: Client requests changes to delivered work.

**User Visibility**:
- **Client**: Sees "Revisions Requested"
- **Manager**: Gets notified - Can send back to writer
- **Writer**: Sees the order again in "In Progress / Revision"
- **Admin**: Can monitor or override

**Backend Logic**:
```sql
UPDATE jobs 
SET status='revision', revision_requested=1, revision_notes=?
WHERE id=?

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, 'delivered', 'revision', ?, 'Client requested revision', NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/request-revision`
```json
{
  "clientId": 789,
  "revisionNotes": "Please adjust the conclusion section"
}
```

**Flow**: Revision → Editing → Delivered (cycle repeats until approved)

---

### ⭐ 10. PAID
**Meaning**: Admin confirms payment from client.

**User Visibility**:
- **All Users**: See "Paid"

**Allowed Actions**:
- System automatically moves to Completed after payment confirmation

**Backend Logic**:
```sql
-- 1. Update job status to paid
UPDATE jobs 
SET status='paid', payment_confirmed=1, updated_at=NOW()
WHERE id=?

-- 2. Credit writer earnings
DECLARE @writer_amount = freelancer_earnings FROM jobs WHERE id=?

UPDATE users 
SET balance = balance + @writer_amount,
    total_earned = total_earned + @writer_amount
WHERE id=? -- writer_id

-- 3. Manager earnings already credited during assign + deliver stages
-- No additional manager credits here

-- 4. Create/update payment record
INSERT INTO payments(job_id, client_id, freelancer_id, amount, status, confirmed_by_admin, confirmed_at, created_at)
VALUES (?, ?, ?, ?, 'completed', 1, NOW(), NOW())

-- 5. Move to completed
UPDATE jobs 
SET status='completed', updated_at=NOW()
WHERE id=?

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, 'paid', 'completed', ?, 'Order completed after payment', NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/confirm-payment`
```json
{
  "adminId": 1,
  "transactionId": "MPESAxxxxxx",
  "paymentMethod": "mpesa",
  "phoneNumber": "0701066845"
}
```

**Earnings Distribution**:
- **Writer**: Receives `freelancerEarnings` from job
- **Manager**: Already received during assign (10 KSh) + deliver (10 + 5×(pages-1) KSh)
- **Platform**: Remainder = amount - freelancerEarnings - manager_total

---

### ⭐ 11. COMPLETED
**Meaning**: System final stage after payment and all processes.

**User Visibility**:
- **All Users**: See "Completed"

**Backend Logic**:
```sql
-- Status moved to 'completed' automatically after payment confirmation
-- No additional processing required
```

**Note**: This is the terminal success state.

---

### ⭐ 12. CANCELLED
**Meaning**: Order no longer active - admin cancelled.

**User Visibility**:
- **All Users**: Can see cancelled status

**Backend Logic**:
```sql
UPDATE jobs 
SET status='cancelled'
WHERE id=?

INSERT INTO jobStatusLogs(job_id, old_status, new_status, changed_by, note, created_at)
VALUES (?, ?, 'cancelled', ?, 'Order cancelled by admin', NOW())
```

**API Endpoint**: `POST /api/jobs/[id]/cancel`
```json
{
  "adminId": 1,
  "reason": "Client requested cancellation"
}
```

**Note**: Cannot cancel orders that are already Completed or Paid.

---

## 🎯 COMPLETE API ENDPOINTS REFERENCE

### Status Transition Endpoints

| Endpoint | Method | Purpose | Who Can Use |
|----------|--------|---------|-------------|
| `/api/jobs/[id]/accept` | POST | Accept pending order | Manager, Admin |
| `/api/jobs/[id]/assign` | POST | Assign writer to order | Manager, Admin |
| `/api/jobs/[id]/submit` | POST | Writer submits work | Writer |
| `/api/jobs/[id]/deliver` | POST | Deliver work to client | Manager |
| `/api/jobs/[id]/approve-by-client` | POST | Client approves work | Client |
| `/api/jobs/[id]/request-revision` | POST | Request revision | Client |
| `/api/jobs/[id]/confirm-payment` | POST | Confirm payment & complete | Admin |
| `/api/jobs/[id]/hold` | POST | Put order on hold | Manager, Admin |
| `/api/jobs/[id]/cancel` | POST | Cancel order | Admin |
| `/api/jobs/[id]/status` | PATCH | Generic status update | Admin |

### Query Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs` | GET | List all jobs (with role-based filtering) |
| `/api/jobs/[id]` | GET | Get single job details |
| `/api/manager/orders` | GET | Get manager's orders (with status filter) |
| `/api/jobs/[id]/attachments` | GET | Get job attachments |

---

## 💰 MANAGER EARNINGS BREAKDOWN

### Assignment Fee
- **Amount**: 10 KSh (flat)
- **When**: When manager assigns a writer to an order
- **Status Transition**: Accepted → Assigned

### Submission Fee
- **Formula**: 10 + (5 × (pages - 1)) KSh
- **When**: When manager delivers work to client
- **Status Transition**: Editing → Delivered

### Examples

| Pages | Assignment Fee | Submission Fee | Total Manager Earnings |
|-------|----------------|----------------|------------------------|
| 1 | 10 KSh | 10 KSh | 20 KSh |
| 2 | 10 KSh | 15 KSh | 25 KSh |
| 5 | 10 KSh | 30 KSh | 40 KSh |
| 10 | 10 KSh | 55 KSh | 65 KSh |

---

## 👨‍💻 WRITER EARNINGS

- **Calculation**: Based on work type and units (pages/slides)
- **CPP (Cost Per Page) Defaults**:
  - Writing: 200 KSh/page
  - Technical: 230 KSh/page
  - Slides: 100 KSh/slide
  - Excel: 200 KSh/unit
- **When Credited**: On payment confirmation (Paid status)
- **Stored In**: `jobs.freelancerEarnings`

---

## 📋 ORDER HISTORY LOGGING

All status transitions are logged in the `jobStatusLogs` table with:
- `job_id`: Order reference
- `old_status`: Previous status
- `new_status`: New status
- `changed_by`: User ID who made the change
- `note`: Descriptive note (including earnings details)
- `created_at`: Timestamp

**Query Example**:
```sql
SELECT * FROM jobStatusLogs 
WHERE job_id = ? 
ORDER BY created_at DESC
```

---

## 🔔 NOTIFICATION SYSTEM

Each status transition triggers notifications to relevant parties:

- **Pending → Accepted**: Notify client
- **Accepted → Assigned**: Notify writer + client
- **Assigned → Editing**: Notify admins + client
- **Editing → Delivered**: Notify client + writer (+ email to client)
- **Delivered → Approved**: Notify admins + writer
- **Delivered → Revision**: Notify writer + admins
- **Approved → Paid**: Notify writer (earnings credited)
- **Paid → Completed**: Notify client
- **Any → On Hold**: Notify all involved parties
- **Any → Cancelled**: Notify all involved parties

---

## ✅ STATUS MAPPING BY ROLE

| Actual Status | Admin | Manager | Client | Writer |
|---------------|-------|---------|--------|--------|
| pending | Pending | Pending | Pending | (hidden) |
| accepted | Accepted | Accepted | In Progress | (hidden) |
| in_progress | In Progress | In Progress | In Progress | (hidden) |
| assigned | Assigned | Assigned | In Progress | In Progress |
| editing | Editing | Editing | In Progress | Submitted |
| delivered | Delivered | Delivered | Delivered | Awaiting Approval |
| approved | Approved | Approved | Approved | Approved |
| revision | Revision | Revision | Revision | Revision |
| paid | Paid | Paid | Paid | Paid |
| completed | Completed | Completed | Completed | Completed |
| cancelled | Cancelled | Cancelled | Cancelled | Cancelled |
| on_hold | On Hold | On Hold | On Hold | On Hold |

**Implementation**: See `src/lib/utils/status-mapper.ts` for role-based status display logic.

---

## 🧪 TESTING GUIDE

### Test Scenario 1: Complete Happy Path
1. Client creates order → Status: **Pending**
2. Manager accepts order → Status: **Accepted** (no earnings yet)
3. Manager assigns writer → Status: **Assigned** (Manager +10 KSh)
4. Writer submits work → Status: **Editing**
5. Manager delivers to client → Status: **Delivered** (Manager +10+5×(pages-1) KSh)
6. Client approves → Status: **Approved**
7. Admin confirms payment → Status: **Paid** → **Completed** (Writer receives earnings)

### Test Scenario 2: Revision Flow
1. Follow steps 1-5 from Scenario 1
2. Client requests revision → Status: **Revision**
3. Writer resubmits → Status: **Editing**
4. Manager re-delivers → Status: **Delivered** (no additional manager earnings)
5. Client approves → Status: **Approved**
6. Admin confirms payment → Status: **Paid** → **Completed**

### Test Scenario 3: On Hold
1. Order at any status (except Completed/Paid)
2. Admin/Manager puts on hold → Status: **On Hold**
3. Admin/Manager resumes → Status reverts to appropriate next status

### Test Scenario 4: Cancellation
1. Order at any status (except Completed/Paid)
2. Admin cancels → Status: **Cancelled** (terminal state)

---

## 📊 DATABASE SCHEMA REQUIREMENTS

### Required Tables
✅ `jobs` - Main orders table with status column
✅ `users` - Users with balance and totalEarned columns
✅ `manager_earnings` - Manager earnings tracking per order
✅ `jobStatusLogs` - Audit trail for all status changes
✅ `notifications` - In-platform notifications
✅ `payments` - Payment records

### Key Columns in jobs table
- `id`, `display_id`, `order_number`
- `client_id`, `assigned_freelancer_id`
- `status` (TEXT) - Current order status
- `pages`, `slides`, `work_type`
- `amount`, `freelancer_earnings`, `manager_earnings`, `admin_profit`
- `payment_confirmed` (BOOLEAN)
- `client_approved` (BOOLEAN)
- `revision_requested` (BOOLEAN)
- `revision_notes` (TEXT)
- Timestamps: `created_at`, `updated_at`

---

## 🎉 IMPLEMENTATION COMPLETE

All order lifecycle statuses are now properly implemented with:
- ✅ Complete API routes for all transitions
- ✅ Manager earnings tracking (assign + submit)
- ✅ Writer earnings distribution on payment
- ✅ Order history logging for all changes
- ✅ Role-based status visibility
- ✅ Notification system for all transitions
- ✅ Payment confirmation and completion flow
- ✅ Revision request and resubmission flow
- ✅ On hold and cancellation capabilities

---

**Last Updated**: 2025-11-17  
**Version**: 1.0.0  
**Status**: Production Ready ✅
