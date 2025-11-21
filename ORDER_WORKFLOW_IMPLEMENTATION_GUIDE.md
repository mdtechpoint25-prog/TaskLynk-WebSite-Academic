# ORDER STATUS WORKFLOW & BUTTON IMPLEMENTATION GUIDE

## 🔄 Complete Order Lifecycle Workflow

```
STAGE 1: PENDING
├─ Status: "pending"
├─ Users: Client, Admin/Manager
├─ Client Actions:
│  ├─ ✏️ Edit order (can change title, description, pages, deadline, amount)
│  └─ ❌ Cancel order
├─ Admin/Manager Actions:
│  ├─ ✅ Accept order → moves to ACCEPTED stage
│  ├─ ❌ Reject order → marked as cancelled
│  └─ ⏸️ Hold order → status becomes "on_hold"
└─ Freelancer: Cannot see this stage (not yet assigned)

STAGE 2: ACCEPTED
├─ Status: "accepted"
├─ Users: Admin/Manager, (Freelancer not yet assigned)
├─ Admin/Manager Actions:
│  ├─ 👤 Assign Freelancer → moves to ASSIGNED stage
│  ├─ ❌ Reject assignment / Send back to PENDING
│  └─ ⏸️ Hold order
├─ Freelancer: Cannot see this stage (not yet assigned)
└─ Client: Can view but not edit

STAGE 3: ASSIGNED / IN-PROGRESS
├─ Status: "assigned" OR "in_progress" (same logical stage, different names)
├─ Users: Admin/Manager, Freelancer, Client
├─ Freelancer Actions (Main Stage for Writer):
│  ├─ 📤 Upload Draft → creates files with type "draft"
│  ├─ 📤 Upload Final → creates files with type "final"
│  ├─ 📤 Upload Revision → creates files with type "revision"
│  ├─ 📝 Upload Reports (required reminder)
│  └─ ✅ Submit Files → moves to EDITING stage
├─ Admin/Manager Actions:
│  ├─ 📁 View all uploads
│  ├─ ⏸️ Hold order
│  └─ ❌ Cancel order (if needed)
└─ Client: Can view progress, cannot edit

STAGE 4: EDITING (Post-Submission, Pre-Final)
├─ Status: "editing"
├─ Users: Admin/Manager, Freelancer, Client
├─ Freelancer Actions:
│  └─ 📤 Upload Revision → if revision requested
├─ Admin/Manager Actions:
│  ├─ 👀 Review work
│  ├─ 🔄 Send Revision to Freelancer → creates revision request (moves to REVISION status)
│  ├─ ✅ Approve & Submit → moves to DELIVERED stage
│  └─ ❌ Reject & Hold
├─ Client Actions:
│  ├─ 👀 Review work
│  └─ 🔄 Request Revision → auto-changes status to REVISION (notifies all)
└─ Notifications: Client, Freelancer, Admin see revision requests

STAGE 5: REVISION (Feedback Loop)
├─ Status: "revision"
├─ Users: All (Client, Freelancer, Admin/Manager)
├─ Freelancer Actions:
│  ├─ 📤 Upload Revision Files
│  └─ ✅ Submit Revision → moves back to EDITING for review
├─ Admin/Manager Actions:
│  ├─ 👀 Review revised work
│  ├─ 🔄 Send Another Revision
│  └─ ✅ Approve Revised Work → moves to DELIVERED
├─ Client Actions:
│  ├─ 👀 View revisions
│  └─ 🔄 Request Another Revision (loops back)
└─ Notifications: All users see updates

STAGE 6: DELIVERED
├─ Status: "delivered"
├─ Users: Client, Admin/Manager, Freelancer
├─ Client Actions:
│  ├─ 💰 Make Payment (M-Pesa)
│  └─ ✅ Approve Work (final acceptance)
├─ Freelancer Actions:
│  └─ 👀 View delivery (final files visible)
├─ Admin/Manager Actions:
│  └─ 👀 Monitor payment & approval
└─ Status Changes: After payment confirmed AND client approves → COMPLETED

STAGE 7: COMPLETED / PAID
├─ Status: "completed" or "paid"
├─ Users: All can view history
├─ Actions:
│  ├─ ⭐ Rate work (Freelancer rated by Client)
│  ├─ 💬 Leave review
│  └─ 📊 Record in history
└─ Order archived for record-keeping

CANCELLED/ON_HOLD:
├─ Status: "cancelled" or "on_hold"
├─ Users: Initiated by Admin/Manager
├─ Can be moved back to PENDING or ACCEPTED (if on_hold)
└─ Client notified

```

## 📋 Button Visibility Matrix

| Stage | Client Buttons | Freelancer Buttons | Admin/Manager Buttons |
|-------|---|---|---|
| PENDING | Edit, Cancel | None | Accept, Reject, Hold |
| ACCEPTED | View Only | None | Assign, Reject, Hold |
| ASSIGNED/IN-PROGRESS | View Progress | Upload Draft, Upload Final, Upload Reports, Submit | View, Hold, Cancel |
| EDITING | Review, Request Revision | Upload Revision (if needed) | Review, Send Revision, Approve, Reject |
| REVISION | View Revisions, Request Another | Upload Revision, Submit | Review, Send Another Revision, Approve |
| DELIVERED | Pay, Approve Work | View Delivery | Monitor |
| COMPLETED | Rate, Review | Rate, Review | Archive |

## 🗂️ File Upload System

### File Types & Status
- **Draft**: Preliminary submission
- **Final**: Ready for review
- **Revision**: Response to revision request
- **Report**: Required supplementary file (reminder freelancer)

### Multi-File Grouping
- All files of the same type share ONE status indicator
- Example: If 3 "final" files are uploaded, they all show as "final" (not separate statuses)
- Display: "📁 Final (3 files)" instead of listing each individually

### Upload Logic
```
Upload Draft → shows "Draft" status
Upload Final → shows "Final" status
Upload Revision → shows "Revision" status
All at once → show multiple status badges
```

## 🔔 Notification System

### Automatic Notifications

1. **Order Accepted** → Notify Freelancer (eligible to bid/accept)
2. **Freelancer Assigned** → Notify Freelancer (work assigned)
3. **Files Submitted** → Notify Admin/Manager & Client
4. **Revision Requested** (by Admin) → Notify Freelancer
5. **Revision Requested** (by Client) → Notify Admin/Manager & Freelancer, AUTO-CHANGE status to "revision"
6. **Revision Submitted** → Notify Admin/Manager & Client
7. **Work Approved** → Notify Client & Freelancer
8. **Payment Confirmed** → Notify Admin/Manager & Freelancer
9. **Work Completed** → Notify All

## 🎯 Implementation Priorities

### Phase 1 (CRITICAL - Complete First)
1. ✅ Add "Accept" button for pending orders (Admin/Manager)
2. ✅ Add "Assign Freelancer" button for accepted orders (Admin/Manager)
3. ✅ Add freelancer upload buttons (Draft, Final, Revision)
4. ✅ Add "Submit Files" button

### Phase 2 (HIGH - Complete After Phase 1)
1. Add "Send Revision" button (Admin/Manager in editing stage)
2. Add "Request Revision" button (Client in any delivery stage)
3. Implement automatic status change on client revision request
4. Add notifications for all revisions

### Phase 3 (MEDIUM - Complete After Phase 2)
1. Implement multi-file grouping by type
2. Add report upload reminder
3. Add order count display on user management pages

### Phase 4 (LOW - Polish)
1. Add rating/review functionality
2. Performance optimization
3. User experience improvements

