# 👥 COMPLETE ROLE REFERENCE - What Each User Can Do

**All 5 Roles - Fully Implemented & Tested**

---

## 🔒 ADMIN

### Purpose
System administrator with full control

### Permissions
- ✅ Create, read, update, delete any order
- ✅ Approve/reject jobs for freelancer assignment
- ✅ Assign writers to jobs
- ✅ Assign editors to jobs
- ✅ Manage all users (create, edit, delete roles)
- ✅ View all system transactions
- ✅ Run automated processes (badge assignment)
- ✅ Receive critical Telegram alerts

### Earnings
- Commission percentage on all completed orders
- Administrative fee if applicable

### Endpoints Access
```
✅ GET /api/admin/badges/auto-assign - Run badge assignment
✅ GET /api/admin/badges/report - View badge statistics
✅ All job management endpoints
✅ All user management endpoints
✅ All payment endpoints
✅ Telegram notifications on critical events
```

### Dashboard Features
- System overview
- All orders across platform
- All users and their metrics
- Revenue and financial summary
- Badge management controls

### Actions in Workflow
```
1. Reviews pending jobs
2. Approves/rejects job posting
3. Assigns writer to approved jobs
4. Monitors overall platform health
5. Assigns editors as needed
6. Triggers badge automation
7. Handles disputes
8. Receives critical alerts
```

---

## 👤 CLIENT

### Purpose
Posts orders for freelancers to complete

### Permissions
- ✅ Create orders with custom requirements
- ✅ View own orders and status
- ✅ Communicate with assigned freelancer
- ✅ Communicate with assigned manager (if applicable)
- ✅ Review and approve/reject delivered work
- ✅ Request revisions
- ✅ Provide feedback and ratings
- ✅ Make payments for orders
- ✅ View order history

### Earnings
- N/A (Client is the payer, not earner)

### Endpoints Access
```
✅ POST /api/jobs - Create new order
✅ PATCH /api/jobs/[id]/status - Update job status
✅ POST /api/jobs/[id]/approve-by-client - Approve delivered work
✅ POST /api/jobs/[id]/request-revision - Request revisions
✅ GET /api/jobs - View own orders
✅ POST /api/messages - Send message to freelancer
✅ GET /api/notifications - See order updates
✅ POST /api/payments - Make payment
✅ GET /api/ratings - Rate completed work
```

### Dashboard Features
- My orders (all status)
- Pending approvals
- Revision history
- Invoices and payments
- Team assignments
- Performance metrics of their team

### Actions in Workflow
```
1. Posts order with requirements
2. Receives admin approval notification
3. Communicates with assigned manager/freelancer
4. Receives delivery notification
5. Reviews delivered work
6. Can:
   - Approve → moves to payment
   - Request revision → back to freelancer
   - Reject → may cancel
7. Makes payment
8. Rates experience
9. Leaves feedback
```

### Status They Trigger
```
pending → ? (awaits admin approval)
delivered (ready for their decision) → approved (→ payment) or revision or cancelled
```

---

## ✍️ FREELANCER / WRITER

### Purpose
Accepts assignments and completes written work

### Permissions
- ✅ View assigned orders
- ✅ Accept or decline assignments
- ✅ Submit work (upload files)
- ✅ Receive feedback and revision requests
- ✅ View order history
- ✅ Communicate with client (direct messaging)
- ✅ Communicate with manager
- ✅ Receive feedback from editor
- ✅ View ratings and feedback
- ✅ Track earnings

### Earnings
- Per-order payment based on pages/complexity
- Deducted: Manager commission, Admin commission
- Paid to: Personal balance (withdrawable)

### Endpoints Access
```
✅ GET /api/jobs - View assigned orders
✅ PATCH /api/jobs/[id]/status - Update to in_progress
✅ POST /api/jobs/[id]/submit - Submit work
✅ GET /api/notifications - Receive status updates
✅ POST /api/messages - Direct message to client
✅ GET /api/freelancer/dashboard - View assigned orders
✅ GET /api/freelancer/earnings - View payment history
✅ PUT /api/profile - Update profile
```

### Dashboard Features
- Assigned orders
- Active projects
- Pending submissions
- Revision requests
- Messages from clients
- Total earnings
- Performance rating
- Badges earned

### Actions in Workflow
```
1. Receives assignment notification
2. Reviews order details
3. Starts work (in_progress)
4. Submits completed files
5. Receives feedback from:
   - Manager (approval gate check)
   - Editor (quality review) [NEW]
6. If approved: Status moves to delivered
7. If rejected: Gets revision request back
8. Client approves or requests revision
9. If approved: Moves to payment
10. Gets paid to balance
11. Can withdraw earnings
```

### Status They Trigger
```
assigned → in_progress (started work)
in_progress → in_progress (submitted, awaits manager review) [NEW]
editing → in_progress (if rejected by editor for revision)
revision → in_progress (resubmitting revised work)
```

### Can't Do
- ❌ Approve own work (needs manager + editor + client)
- ❌ Set own payment amount
- ❌ See other freelancers' earnings
- ❌ Communicate with admin directly
- ❌ Assign themselves to jobs

---

## 📋 MANAGER

### Purpose
Intermediate layer managing clients and freelancers

### Permissions (NEW - All Complete)
- ✅ Accept/assign jobs to writers under their supervision
- ✅ **Approve/reject writer submissions** (NEW GATE)
- ✅ Assign writers to jobs
- ✅ Assign editors to jobs
- ✅ **Unassign users from management** (NEW)
- ✅ View performance metrics for team (NEW)
- ✅ Communicate with clients and writers
- ✅ Receive notifications on order progress
- ✅ View team earnings and performance
- ✅ Manage assigned clients

### Earnings (Standardized)
- Assignment fee: 10 KSh (per order assigned)
- Submission fee: 10 + 5×(pages-1) KSh (when work delivered)
- **Total for 5-page order: 40 KSh**

### Endpoints Access
```
✅ GET /api/manager/dashboard - Manager dashboard
✅ POST /api/manager/[id]/approve-submission - Approve work [NEW]
✅ PUT /api/manager/[id]/approve-submission - Reject work [NEW]
✅ DELETE /api/manager/[id]/unassign-user - Unassign user [NEW]
✅ GET /api/manager/[id]/performance - Performance metrics [NEW]
✅ GET /api/jobs - View managed orders
✅ PATCH /api/jobs/[id]/status - Update order status
✅ POST /api/messages - Communicate with team
✅ GET /api/notifications - Receive updates
✅ GET /api/manager/earnings - View commissions
```

### Dashboard Features (NEW)
- Orders managed (count & status)
- Team members (clients & freelancers)
- Performance metrics:
  - Completion rate
  - On-time delivery rate
  - Average rating
  - Revenue managed
  - Writer satisfaction
- Recent orders
- Top performing writers
- Top performing clients
- Earnings breakdown

### Actions in Workflow (NEW TWO-GATE SYSTEM)
```
1. Client posts order
2. Admin approves job
3. Admin/Manager assigns writer
4. Writer submits work (in_progress)
5. MANAGER REVIEWS (NEW GATE):
   - If approved: Status → editing
   - If rejected: Status → in_progress (back to writer)
6. IF approved by manager:
   - EDITOR REVIEWS (quality check):
   - If approved: Status → delivered
   - If rejected: Status → in_progress (revision)
7. Client reviews delivered work
8. Client approves → payment
9. Manager earns:
   - 10 KSh assignment fee (at step 3)
   - 10+5×(pages-1) KSh submission fee (at step 6)
```

### New Capabilities with Fixes
- ✅ **Quality Gate Control** - Can approve or reject submissions before editor sees them
- ✅ **Team Management** - Can unassign users no longer needed
- ✅ **Performance Tracking** - See real metrics on team performance
- ✅ **Consistent Earnings** - Formula standardized and transparent

### Status They Can Trigger
```
in_progress → editing (approve submission) [NEW]
in_progress → in_progress (reject submission with revisions) [NEW]
```

### Can't Do
- ❌ Approve orders (only admin)
- ❌ Process payments directly
- ❌ See other manager's teams
- ❌ Create new editor roles
- ❌ Set own commission rates

---

## ✏️ EDITOR

### Purpose
Quality assurance and plagiarism checking

### Permissions (NEW - Full Role)
- ✅ View assigned work for review
- ✅ Check plagiarism and quality
- ✅ Check formatting and standards
- ✅ **Approve work for delivery** (NEW)
- ✅ **Reject work for revision** (NEW)
- ✅ View dashboard of pending reviews (NEW)
- ✅ Provide detailed feedback
- ✅ Track approval metrics
- ✅ View completion history

### Earnings (Structure Available)
- Could be per-review or bundled compensation
- Currently no earnings configured (can be added)

### Endpoints Access
```
✅ GET /api/editor/dashboard - See assigned work [NEW]
✅ POST /api/editor/[id]/approve - Approve for delivery [NEW]
✅ POST /api/editor/[id]/reject - Request revision [NEW]
✅ GET /api/notifications - Receive assignments
✅ POST /api/messages - Communicate with manager
```

### Dashboard Features (NEW)
- Pending reviews (count & details)
- In-review orders (current work)
- Completed reviews (history)
- Approval rate statistics
- Quality metrics

### Actions in Workflow (NEW)
```
1. Manager approves submission
2. Job status moves to 'editing'
3. Editor sees in dashboard
4. Editor reviews work:
   - Checks plagiarism
   - Verifies formatting
   - Checks quality standards
   - Reads for comprehension
5. Editor decides:
   - APPROVE → Status to 'delivered' (client can now review)
   - REJECT → Status to 'in_progress' (freelancer revises)
6. If rejected:
   - Writer gets revision notes
   - Goes back through manager → editor cycle
7. If approved:
   - Client sees work as 'delivered'
   - Can approve, request revisions, or reject
8. Final approval goes to payment
```

### Status They Control
```
editing → delivered (if approved) [NEW]
editing → in_progress (if rejected, back to writer) [NEW]
```

### Quality Gates They Enforce
- ✅ Plagiarism check - No copied content
- ✅ Formatting check - Meets requirements
- ✅ Grammar check - Professional quality
- ✅ Requirement check - Fulfills order needs
- ✅ Completeness check - All requirements met

### Can't Do
- ❌ Approve final payment (only client + system)
- ❌ Modify order requirements
- ❌ Communicate directly with client
- ❌ Process any financial transactions
- ❌ Assign themselves to orders

---

## 🔄 INTERACTION MATRIX

### Who Can Talk to Whom

```
ADMIN:
  ↔ Client (dispute resolution, account help)
  ↔ Freelancer (performance issues, policy)
  ↔ Manager (system alerts, oversight)
  ↔ Editor (quality coordination)

CLIENT:
  ↔ Manager (order management, communication)
  ↔ Freelancer (direct messages) [via Manager oversight]
  → Admin (disputes/escalations)

FREELANCER:
  ↔ Manager (assignments, feedback, earnings)
  ↔ Client (direct messages)
  ← Editor (feedback via Manager)
  → Admin (appeals/issues)

MANAGER:
  ↔ Client (order assignment, oversight)
  ↔ Freelancer (assignments, quality gate)
  ↔ Editor (work coordination) [NEW]
  ↔ Admin (escalations, support)

EDITOR:
  ↔ Manager (work assignment, feedback)
  ← Freelancer (receives work via assignment)
  → Admin (quality standards, support)
```

---

## 📊 ROLE COMPARISON TABLE

| Capability | Admin | Client | Freelancer | Manager | Editor |
|------------|-------|--------|-----------|---------|--------|
| **Post Order** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Accept Job** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Submit Work** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Approve Work** | ✅ | ✅ | ❌ | **✅ NEW** | **✅ NEW** |
| **Reject Work** | ✅ | ✅ | ❌ | **✅ NEW** | **✅ NEW** |
| **Process Payment** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Metrics** | ✅ | ✅ | ✅ | **✅ NEW** | ✅ |
| **Manage Team** | ✅ | ❌ | ❌ | **✅ NEW** | ❌ |
| **Quality Review** | ❌ | ❌ | ❌ | ❌ | **✅ NEW** |

---

## 🚀 Workflow Participation

### Simple Order (No Manager/Editor)
```
Client → Admin → Freelancer → Client → Payment
```

### Full Workflow with Manager & Editor (NEW - COMPLETE)
```
Client → Admin → Manager → Freelancer
                    ↓ (after manager approves)
                 Editor → Freelancer (if rejected)
                    ↓ (if approved)
                 Client → Payment
```

---

## ✅ What Each Role CAN'T Do

```
ADMIN: Nothing - Full system access

CLIENT:
  • Can't approve own work (needs manager + editor first)
  • Can't set payment amounts
  • Can't see other clients' orders

FREELANCER:
  • Can't approve own submissions
  • Can't reject work
  • Can't manage other freelancers
  • Can't communicate with admin directly
  • Can't see other freelancers' earnings

MANAGER:
  • Can't approve orders (only admin)
  • Can't process payments
  • Can't manage other managers' teams
  • Can't set commission rates
  • Can't see system-wide analytics (only their team)

EDITOR:
  • Can't approve final payment (only client)
  • Can't modify order requirements
  • Can't communicate with client directly
  • Can't assign themselves to orders
  • Can't process refunds
```

---

## 🎯 Key Improvements by Role

### Admin Improvements
- ✅ New editor role for quality assurance
- ✅ Badge automation system reduces manual work
- ✅ Manager approval gate ensures quality
- ✅ Performance metrics on managers

### Client Improvements
- ✅ Quality assured work through editor stage
- ✅ Multiple feedback stages (manager + editor)
- ✅ Better communication with manager
- ✅ Clearer workflow visibility

### Freelancer Improvements
- ✅ Feedback from dedicated editor role
- ✅ Manager oversight ensures fair treatment
- ✅ Clear revision workflow
- ✅ Direct communication with clients
- ✅ Badge system for recognition

### Manager Improvements
- ✅ **New approval gate before editor** - Quality control
- ✅ **Can unassign users** - Team management
- ✅ **Performance dashboard** - Metrics tracking
- ✅ **Standardized earnings** - Transparent formula
- ✅ Can coordinate with editor

### Editor Improvements
- ✅ **Complete role implementation** - Now fully functional
- ✅ **Dashboard to see assigned work** - Better visibility
- ✅ **Clear approve/reject workflow** - No ambiguity
- ✅ **Contribution tracked** - Completion metrics

---

## 📋 Access Control Summary

**Every endpoint verifies:**
```
1. User is authenticated
2. User has correct role
3. User owns/manages the resource
4. Action is allowed for that role/resource combination
```

**Returns 403 Unauthorized if:**
- ✅ User role doesn't match endpoint requirement
- ✅ User doesn't own the order/job
- ✅ User isn't the assigned manager/editor
- ✅ Action violates workflow rules

---

## 🎓 Role Training Points

### For Clients
- "Your work goes through Manager & Editor approval before you see it"
- "Manager reviews first, then Editor checks quality"
- "You can always request revisions"

### For Freelancers
- "Manager reviews your submission before Editor sees it"
- "Editor provides quality feedback"
- "Get feedback to improve your work"

### For Managers
- "You're the first quality gate before Editor"
- "You can unassign users you no longer need"
- "See your team's performance in dashboard"

### For Editors
- "You're the quality assurance expert"
- "Approve if work meets standards, reject if revisions needed"
- "Manager pre-screened the work already"

### For Admins
- "Managers now have quality control gate"
- "Editors handle plagiarism & formatting"
- "Badges auto-assign and revoke based on criteria"

---

**Last Updated:** November 21, 2025  
**Version:** TaskLynk v2.0 - 5 Roles Complete  
**Status:** ✅ All Roles Fully Implemented