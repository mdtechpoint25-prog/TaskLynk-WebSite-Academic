# ADMIN PANEL QUICK REFERENCE

## 🎯 Complete Admin Capabilities & Actions

---

## 📊 ADMIN DASHBOARD OVERVIEW

### Statistics Cards (Dashboard Homepage)
- Total Orders
- Active Orders  
- Completed Orders
- Pending Payments
- Total Clients
- Total Writers
- Revenue Summary
- Withdrawals Pending

### Order Status Overview
- Pending
- Assigned
- In Progress
- Submitted/Editing
- Under Review
- Revision
- Completed
- Paid
- Cancelled

### Quick Actions
- Add New Order (admin-created)
- Add New Manager
- Add New Writer
- Send Broadcast Messages
- View System Logs

---

## 📋 ORDERS MANAGEMENT

### View All Orders
**Location**: `/admin/jobs` or `/admin/dashboard`

**Filters Available**:
- Order ID / Display ID
- Client name
- Writer name
- Manager name
- Status (all statuses)
- Deadline range
- Work Type (Writing, Technical, Slides, Excel)
- Category
- Single-Spaced (Yes/No)
- Printable Sources (Yes/No)

**Order List Columns**:
- Order ID / Display ID
- Order Number
- Title
- Client
- Writer (if assigned)
- Manager (if assigned)
- Pages / Slides
- CPP & Total Price
- Freelancer Earnings
- Manager Earnings
- Admin Profit
- Status
- Deadline (Client vs Freelancer)
- Created At

---

## 🔧 ACTIONS ON EACH ORDER

### 1️⃣ View Order Details
**Action**: Click order ID or "View" button

**Shows**:
- Complete order description
- Client instructions & files
- Writer submissions (grouped by type)
- Manager uploads
- Admin notes
- Complete timeline history
- Status tracking
- All attachments grouped by category:
  - Completed Paper
  - Printable Sources
  - AI Report
  - Plagiarism Report
  - Graphics
  - Outline
  - Abstract
  - Revision Files
  - Draft Files
  - Instructions Files
- Price breakdown summary
- Messages/Chat log
- Payment status
- Request details (printable sources, single spaced, draft)

---

### 2️⃣ Accept Pending Order
**API**: `POST /api/jobs/[id]/accept`  
**When**: Order status = 'pending'  
**Payload**:
```json
{
  "adminId": 1
}
```

**What Happens**:
- Status changes: pending → accepted
- Client notified
- Order history logged
- Order becomes visible to managers for assignment

---

### 3️⃣ Assign Writer to Order
**API**: `POST /api/jobs/[id]/assign`  
**When**: Order status = 'accepted' or 'approved'  
**Payload**:
```json
{
  "freelancerId": 456,
  "changedBy": 1
}
```

**What Happens**:
- Status changes: accepted → assigned
- **Manager earns 10 KSh** (assignment fee)
- Writer notified via email + in-app
- Client notified
- Bids (if any) accepted/rejected
- Order history logged

---

### 4️⃣ Change Order Status Manually
**API**: `PATCH /api/jobs/[id]/status`  
**When**: Any time admin override needed  
**Payload**:
```json
{
  "status": "delivered",
  "changedBy": 1,
  "note": "Admin override - manual delivery"
}
```

**Available Status Options**:
- pending
- accepted
- approved
- assigned
- in_progress
- editing
- delivered
- revision
- on_hold
- paid
- completed
- cancelled

**Validation**: Status transitions must follow allowed rules (see ORDER_LIFECYCLE_IMPLEMENTATION_COMPLETE.md)

---

### 5️⃣ Upload Files to Order
**API**: `POST /api/jobs/[id]/attachments`  
**When**: Any time

**Admin Can Upload**:
- Completed papers
- Printable sources
- Revision files
- AI reports
- Plagiarism reports
- Graphics
- Any other file category

**What Happens**:
- File uploaded and categorized
- All involved parties can view
- File appears in order detail view

---

### 6️⃣ Apply Fine or Bonus to Writer
**API**: `POST /api/users/[id]/adjust-balance` (or similar)  
**When**: Quality issues or exceptional work

**Admin Chooses**:
- Amount (positive for bonus, negative for fine)
- Reason (required)
- Writer ID
- Order ID (optional reference)

**What Happens**:
- Entry added to adjustments/transactions table
- Writer balance recalculated
- Writer notified with reason
- Admin audit log created

---

### 7️⃣ Reassign Writer
**API**: `POST /api/jobs/[id]/reassign` or use Assign endpoint with new writer  
**When**: Writer not performing or unavailable

**What Happens**:
- Previous writer unassigned (notified)
- New writer assigned (notified)
- Manager may earn new assignment fee (depends on policy)
- Order history logged
- Client notified of change

---

### 8️⃣ Deliver Work to Client (Override)
**API**: `POST /api/jobs/[id]/deliver`  
**When**: Manager unavailable or admin override needed  
**Payload**:
```json
{
  "managerId": 123
}
```

**What Happens**:
- Status changes: editing → delivered
- **Manager earns submission fee**: 10 + (5 × (pages-1)) KSh
- Client notified via email + in-app
- Writer notified
- Order ready for client approval

---

### 9️⃣ Confirm Payment & Complete Order
**API**: `POST /api/jobs/[id]/confirm-payment`  
**When**: Client has paid (status = 'approved')  
**Payload**:
```json
{
  "adminId": 1,
  "transactionId": "MPESA12345678",
  "paymentMethod": "mpesa",
  "phoneNumber": "0701066845"
}
```

**What Happens**:
1. Status changes: approved → paid
2. **Writer balance credited** with freelancerEarnings
3. Manager earnings finalized (already credited during assign + deliver)
4. Payment record created/updated
5. Status automatically moves: paid → completed
6. All parties notified
7. Invoice generated (if applicable)
8. Order locked from further changes

---

### 🔟 Put Order On Hold
**API**: `POST /api/jobs/[id]/hold`  
**When**: Need to pause processing  
**Payload**:
```json
{
  "adminId": 1,
  "reason": "Awaiting client clarification on instructions"
}
```

**Use Cases**:
- Client not responding
- Payment delay
- Missing information
- System/technical issue
- Dispute resolution

**What Happens**:
- Status changes: [current] → on_hold
- All involved parties notified with reason
- Order paused but not cancelled
- Can be resumed by changing status back

---

### 1️⃣1️⃣ Cancel Order
**API**: `POST /api/jobs/[id]/cancel`  
**When**: Order cannot continue  
**Payload**:
```json
{
  "adminId": 1,
  "reason": "Client requested cancellation"
}
```

**Restrictions**: Cannot cancel orders in 'completed' or 'paid' status

**What Happens**:
- Status changes: [current] → cancelled
- All involved parties notified
- Order locked (terminal state)
- No earnings distributed
- Refund handling (if applicable)

---

### 1️⃣2️⃣ Delete Order (Permanent)
**API**: `DELETE /api/jobs/[id]`  
**When**: Testing or data cleanup (USE WITH CAUTION)

**What Happens**:
- Order completely removed from system
- Related files deleted
- Payment records removed
- Order history removed
- Statistics recalculated

⚠️ **Warning**: This is irreversible. Use Cancel instead when possible.

---

## 👥 USER MANAGEMENT

### A. Manage Clients

**View Clients**: `/admin/users?role=client`

**Client Fields Visible**:
- Name, Email, Phone
- Display ID
- Orders placed (count)
- Total spent
- Rating / Client Tier
- Badge
- Priority status (regular, high, VIP)
- Status (active/suspended/blacklisted)
- Account type (regular vs account_owner)
- Assigned manager
- Created date
- Last login

**Actions on Clients**:

1. **View Client Details & Orders**
   - See all orders by client
   - View payment history
   - Review communication history

2. **Edit Client Information**
   - Update name, email, phone
   - Change client tier manually
   - Set priority status
   - Assign/reassign manager

3. **Suspend Client Account**
   - **API**: `POST /api/users/[id]/suspend`
   - Temporarily disable account
   - Set suspension duration
   - Provide reason
   - Client cannot place new orders while suspended

4. **Unsuspend Client Account**
   - **API**: `POST /api/users/[id]/unsuspend`
   - Restore account access
   - Client notified

5. **Blacklist Client**
   - **API**: `POST /api/users/[id]/blacklist`
   - Permanently block account
   - Provide reason
   - Cannot be reversed without database intervention

6. **View Client Financial History**
   - **API**: `GET /api/clients/[id]/financial-history`
   - All payments
   - All invoices
   - Spending patterns
   - Outstanding balances

---

### B. Manage Writers/Freelancers

**View Writers**: `/admin/users?role=freelancer`

**Writer Fields Visible**:
- Name, Email, Phone
- Display ID
- Expertise / Categories
- Default CPP (100, 200, or 230 KSh)
- Current balance
- Total earnings
- Rating / Average score
- Badge (Bronze, Silver, Gold, Platinum, Diamond)
- Completed jobs count
- Active orders count
- On-time delivery rate
- Revision rate
- Status (active/suspended/blacklisted)
- Assigned manager
- Documents uploaded (CV, ID, etc.)
- Created date
- Last active

**Actions on Writers**:

1. **Approve/Reject Writer Application**
   - **API**: `POST /api/users/[id]/approve` or `/reject`
   - Review application documents
   - Set initial writer status
   - Assign default CPP rate
   - Assign manager

2. **Activate/Deactivate Writer**
   - Temporarily disable from taking orders
   - Writer can still view their dashboard

3. **Suspend Writer Account**
   - **API**: `POST /api/users/[id]/suspend`
   - Block from bidding and working
   - Set duration
   - Provide reason

4. **Reset Writer Password**
   - Send password reset link
   - Or set temporary password

5. **Apply Fine to Writer**
   - Deduct from balance
   - Provide reason
   - Writer notified

6. **Apply Bonus to Writer**
   - Add to balance
   - Provide reason (exceptional quality, etc.)
   - Writer notified

7. **Review Writer Performance**
   - View all completed orders
   - See ratings received
   - Check on-time delivery stats
   - Review revision requests
   - Analyze earnings over time

8. **Assign/Change Manager for Writer**
   - Assign writer to a manager
   - Transfer to different manager
   - Remove manager assignment

9. **Force Withdraw/Adjust Balance**
   - Manually adjust writer balance
   - Process withdrawal request
   - Handle payment disputes

10. **Update Writer Badge Manually**
    - Override automatic badge calculation
    - Award special badges

---

### C. Manage Managers

**View Managers**: `/admin/managers` or `/admin/users?role=manager`

**Manager Fields Visible**:
- Name, Email, Phone
- Display ID
- Writers managed (count)
- Clients assigned (count)
- Orders handled (count)
- Total earnings
- Current balance
- Assignments completed
- Deliveries completed
- Performance score
- Status (active/inactive)
- Created date
- Last active

**Actions on Managers**:

1. **Invite New Manager**
   - **API**: `POST /api/admin/invite-manager`
   - Send invitation email with unique token
   - Manager registers via invitation link
   - Auto-assigned role='manager'

2. **Link/Assign Writers to Manager**
   - **API**: `POST /api/admin/managers/[id]/assign-users`
   - Assign multiple writers
   - Manager sees these writers' orders
   - Manager can assign orders to these writers

3. **Link/Assign Clients to Manager**
   - Assign specific clients
   - Manager handles these clients' orders

4. **Unlink Writers/Clients**
   - Remove assignments
   - Reassign to different manager

5. **View Manager Activities**
   - See all orders processed
   - View assignment history
   - Check delivery history
   - Review earnings breakdown

6. **Approve Manager Earnings**
   - View pending manager payments
   - Approve for withdrawal
   - Process payouts

7. **Audit Manager Performance**
   - Orders assigned per month
   - Orders delivered per month
   - Average delivery time
   - Client satisfaction
   - Writer satisfaction

8. **Suspend/Deactivate Manager**
   - Temporarily disable
   - Reassign their writers/clients

---

## 💰 PAYMENTS MANAGEMENT

**Location**: `/admin/payments`

### A. Client Payments

**View Incoming Payments**:
- All payment records
- Filter by status (pending, completed, failed)
- Filter by payment method
- Filter by date range

**Payment Record Fields**:
- Payment ID
- Order ID / Display ID
- Client name
- Amount
- Payment method (M-Pesa, Bank, etc.)
- Transaction reference
- Status
- Created date
- Confirmed date
- Confirmed by (admin name)

**Actions**:

1. **Verify Payment**
   - Check transaction reference
   - Confirm amount matches

2. **Confirm Payment**
   - **API**: `POST /api/jobs/[id]/confirm-payment`
   - Distribute earnings
   - Complete order
   - Generate invoice

3. **Mark Invoice as Paid**
   - **API**: `POST /api/invoices/[id]/mark-paid`
   - Update invoice status
   - Link to payment record

4. **Recalculate Balances**
   - Run balance audit script
   - Fix discrepancies
   - Update user balances

5. **Generate Invoice**
   - Create PDF invoice
   - Email to client
   - Store in system

---

### B. Writer Withdrawals

**View Withdrawal Requests**:
- All pending withdrawals
- Filter by writer
- Filter by amount range
- Filter by date

**Withdrawal Fields**:
- Request ID
- Writer name
- Amount requested
- Current balance
- Payment method
- Bank details / M-Pesa number
- Request date
- Status (pending, approved, paid, rejected)

**Actions**:

1. **Approve Withdrawal**
   - **API**: `POST /api/withdrawals/[id]/approve`
   - Verify writer has sufficient balance
   - Mark as approved
   - Writer notified

2. **Reject Withdrawal**
   - **API**: `POST /api/withdrawals/[id]/reject`
   - Provide reason
   - Writer notified

3. **Process Payment**
   - Mark as paid after transfer
   - Update writer balance
   - Record transaction

4. **Edit Payment Details**
   - Update bank info
   - Change amount (if needed)

---

### C. Manager Earnings

**View Manager Payments**:
- All manager earnings records
- Group by manager
- Group by order
- Filter by earning type (assign vs submit)

**Manager Earnings Breakdown**:
- Manager name
- Order ID
- Earning type (Assign/Submit)
- Amount
- Date credited
- Total per order
- Total per manager

**Actions**:

1. **View Detailed Breakdown**
   - See all earnings by manager
   - Export to CSV

2. **Approve Payouts**
   - Process manager withdrawals
   - Same process as writer withdrawals

3. **Audit Manager Earnings**
   - Verify calculation accuracy
   - Check for duplicates
   - Recalculate if needed

---

## 📁 ATTACHMENT MANAGEMENT

**Location**: `/admin/storage-setup` or `/admin/attachments`

**View All File Uploads**:
- Across all orders
- All users
- All categories

**Filter Options**:
- File type (PDF, DOC, Image, etc.)
- Upload type category:
  - Completed Paper
  - Printable Sources
  - Plagiarism Report
  - AI Report
  - Graphics
  - Outline
  - Abstract
  - Draft
  - Instructions
  - Revision
- Uploaded by (role: client, writer, manager, admin)
- Order ID
- Date range
- File size range

**Actions**:

1. **View File Details**
   - Filename
   - File size
   - Upload date
   - Uploaded by
   - Associated order
   - Download count

2. **Download Files**
   - Single file
   - Bulk download by filter

3. **Delete Files**
   - Remove individual files
   - Scheduled deletion
   - Bulk delete

4. **Replace Files**
   - Upload new version
   - Maintain file history

5. **Approve Writer Uploads**
   - Review for quality
   - Approve or request changes

6. **Scheduled File Cleanup**
   - Auto-delete after order completion + X days
   - Currently set to 7 days after completion

---

## 📊 REPORTS & ANALYTICS

**Location**: `/admin/performance` or `/admin/reports`

### Order Reports

1. **Orders Per Status**
   - Count by each status
   - Percentage distribution
   - Trend over time

2. **Orders Per Client**
   - Top clients by order count
   - Top clients by spending
   - Client retention rate

3. **Orders Per Writer**
   - Top writers by order count
   - Top writers by earnings
   - Writer performance scores

4. **Late Deliveries**
   - Orders past deadline
   - By writer
   - By order type

5. **Revision Count**
   - Orders with revisions
   - Revision rate by writer
   - Average revisions per order

6. **Average Rating Per Writer**
   - Writer ratings distribution
   - Top-rated writers
   - Writers needing improvement

---

### Financial Reports

1. **Total Revenue**
   - All time
   - Monthly/Yearly breakdown
   - Growth rate

2. **Client Spending**
   - Total spent per client
   - Average order value
   - Spending trends

3. **Writer Earnings**
   - Total paid to writers
   - Average earnings per writer
   - Earnings distribution

4. **Manager Earnings**
   - Total manager payouts
   - By manager
   - By earning type

5. **Platform Profit**
   - Revenue - (Writer Earnings + Manager Earnings)
   - Profit margin percentage
   - Profit trends

6. **Pending Balances**
   - Total pending writer payments
   - Total pending manager payments
   - Cash flow projection

7. **Withdrawal History**
   - All processed withdrawals
   - By payment method
   - Monthly totals

---

### Performance Reports

1. **Writer Performance Score**
   - Composite score calculation
   - Factors: on-time delivery, rating, revision rate
   - Leaderboard

2. **Manager Efficiency Score**
   - Orders processed per month
   - Average time to assign
   - Average time to deliver
   - Client satisfaction

3. **Order Turnaround Time**
   - Average time from creation to completion
   - By order type
   - By writer
   - Trend over time

4. **Client Satisfaction**
   - Approval rate
   - Revision request rate
   - Repeat client rate

---

## ⚙️ SYSTEM SETTINGS

**Location**: `/admin/settings`

### Service Categories

**Manage Service Types**:
- Add new work type (Writing, Technical, Slides, Excel, etc.)
- Edit existing categories
- Remove categories
- Set default CPP for each category

---

### Pricing Rules

**Configure Platform Pricing**:

1. **Default CPP for Clients**
   - Pages: 250 KSh minimum
   - Slides: 150 KSh minimum

2. **Default CPP for Writers**
   - Writing: 200 KSh/page
   - Technical: 230 KSh/page
   - Slides: 100 KSh/slide
   - Excel: 200 KSh/unit

3. **Slide Pricing Rules**
   - Enable/disable slide orders

4. **Single Spaced Multiplier**
   - Currently 2x (double price)

5. **Printable Sources Availability**
   - Enable/disable feature
   - Set additional charge (if any)

6. **Manager Earnings Formulas**
   - Assignment fee: Currently 10 KSh flat
   - Submission fee: Currently 10 + (5 × (pages-1))
   - Can be adjusted

---

### Platform Automation

**Configure Automated Actions**:

1. **Email Notifications**
   - Enable/disable per event type:
     - Order created
     - Order assigned
     - Work delivered
     - Payment confirmed
     - etc.
   - Customize email templates

2. **WhatsApp Messages** (if integrated)
   - Enable/disable
   - Configure triggers
   - Message templates

3. **Telegram Alerts** (if integrated)
   - Admin alerts
   - User notifications

4. **Deadline Reminders**
   - Send reminder X hours before deadline
   - To writer
   - To manager
   - To client

5. **File Cleanup Schedule**
   - Auto-delete completed order files after X days
   - Currently: 7 days after completion

---

### Attachment Type Configuration

**Manage File Categories**:

**Current Categories**:
- Completed Paper
- Printable Sources
- AI Report
- Plagiarism Report
- Graphics
- Outline
- Abstract
- Draft
- Instructions
- Revision

**Actions**:
- Add new category
- Rename category
- Remove category
- Set file size limits per category
- Set allowed file types per category

---

## 💬 COMMUNICATION CENTER

**Location**: `/admin/messages` or `/admin/emails`

### Send Messages to Writers

**Options**:
- Individual writer
- Group of writers (by badge, rating, etc.)
- All writers

**Message Types**:
- General announcement
- Quality feedback
- Performance warning
- Payment notification
- System update

---

### Send Messages to Clients

**Options**:
- Individual client
- Group of clients (by tier, priority)
- All clients

**Message Types**:
- Service update
- Promotion
- Feedback request
- Payment reminder
- Platform news

---

### Broadcast Announcements

**Send to All Users**:
- Platform-wide announcement
- Maintenance notice
- New feature announcement
- Policy update

---

### Send Quality Notices

**To Specific Writer**:
- Quality improvement needed
- Exceptional work recognition
- Training recommendation

---

### Respond to Order Chat Messages

**View Order Chat**:
- See all messages in order thread
- Between client and writer
- Includes manager and admin messages

**Actions**:
- Reply to messages
- Moderate content
- Resolve disputes
- Provide clarification

---

## 🔔 NOTIFICATIONS CENTER

**Location**: `/admin/notifications`

**Admin Receives Alerts For**:
- New orders created
- Writer submissions
- Revision requests
- Payment received
- Withdrawal requests
- Disputes/Issues
- System warnings/errors
- User reports

**Notification Types**:
- In-app notifications (bell icon)
- Email notifications
- Browser push notifications (if enabled)

**Actions**:
- Mark as read
- Mark all as read
- Filter by type
- Take action directly from notification

---

## 📝 ORDER TIMELINE VIEW

**Location**: Per-order detail page

**Shows Complete Order History**:

**Events Logged**:
- Order created (timestamp, client)
- Admin/Manager accepted (timestamp, user)
- Writer assigned (timestamp, manager, earnings)
- Status changes (all transitions)
- Files uploaded (by whom, type)
- Messages sent (sender, preview)
- Revisions requested (client, notes)
- Payment confirmed (admin, amount)
- Manager earnings credited (type, amount)
- Order completed (timestamp)

**Stored In**: `jobStatusLogs` table

**Display Format**:
- Timeline view (chronological)
- Each event with icon
- User responsible
- Timestamp
- Action taken
- Result/Impact

---

## 🔐 ACCESS CONTROL (RBAC)

**Admin Permissions**: **FULL ACCESS**

Admin can override:
- Writer limits
- Manager restrictions
- Order deadlines
- Status changes (any transition)
- Payment processing
- User suspensions
- Earnings adjustments

**Admin is Superuser**: No restrictions

---

## 🛠️ HIDDEN FEATURES (Developer/Admin Only)

**Access**: Via direct API calls or admin-only UI sections

1. **Data Recalculation Scripts**
   - Recalculate all writer balances
   - Recalculate all manager earnings
   - Fix balance discrepancies

2. **Balance Recalculation Functions**
   - **API**: `POST /api/admin/recalculate-balances`
   - Recompute from completed orders
   - Audit and fix

3. **Bulk Status Updates**
   - Update multiple orders at once
   - Bulk assign writers
   - Bulk deliver orders

4. **User Impersonation Mode** (if implemented)
   - View platform as another user
   - For support/debugging

5. **Log Downloads**
   - Download system logs
   - Download order history
   - Download financial logs

6. **System Restore Tools**
   - Backup database
   - Restore from backup
   - Rollback transactions

7. **Test User Creation**
   - **API**: `POST /api/admin/create-test-users`
   - Generate sample clients/writers/orders
   - For testing features

---

## 🔗 RELATIONSHIPS WITH OTHER ROLES

| Role | Admin Access | Admin Actions Available |
|------|--------------|-------------------------|
| **Client** | Full | Edit profile, suspend account, message, view all orders, adjust balance, change tier/priority |
| **Writer** | Full | Edit profile, approve/reject applications, suspend account, reassign orders, add fines/bonuses, force withdraw, adjust balance, update badge |
| **Manager** | Full | Edit profile, add/remove assigned writers/clients, approve earnings, message, view activities, suspend account |
| **Orders** | Full | Create, edit, delete, assign, reassign, change status (any transition), manage all files, cancel anytime, put on hold |
| **Payments** | Full | Approve, reject, recalculate, generate invoices, process withdrawals, confirm payments, refund |
| **Attachments** | Full | View all files, delete any file, upload to any order, approve uploads, schedule deletion |
| **System Settings** | Full | Complete control over all settings, pricing, categories, automation, notifications |

---

## 🎯 ADMIN WORKFLOW EXAMPLES

### Workflow 1: New Order Processing
1. Client creates order → Status: **Pending**
2. Admin reviews order details
3. Admin accepts order → Status: **Accepted** (or can assign directly)
4. Admin assigns to manager (if not auto-assigned)
5. Manager or Admin assigns writer → Status: **Assigned** (Manager +10 KSh)
6. Writer works and submits → Status: **Editing**
7. Manager delivers to client → Status: **Delivered** (Manager +X KSh)
8. Client approves → Status: **Approved**
9. Admin confirms payment → Status: **Paid** → **Completed** (Writer + Manager paid)

---

### Workflow 2: Handling Problematic Writer
1. Admin receives complaints about writer quality
2. Admin reviews writer's completed orders
3. Admin checks revision rate and ratings
4. Options:
   - Apply fine with explanation
   - Send quality warning message
   - Assign training/mentoring
   - Suspend temporarily
   - Reassign current orders to other writers
   - If severe: Blacklist account

---

### Workflow 3: Processing Withdrawal Request
1. Writer submits withdrawal request
2. Admin receives notification
3. Admin verifies writer balance
4. Admin checks for pending orders
5. Admin approves withdrawal
6. Admin processes payment via M-Pesa/Bank
7. Admin marks withdrawal as paid
8. Writer balance updated
9. Writer notified

---

### Workflow 4: Resolving Order Dispute
1. Client or writer reports issue via message
2. Admin reviews order details and timeline
3. Admin reviews all communications
4. Admin checks file uploads
5. Admin makes decision:
   - Request revision from writer
   - Partial refund to client
   - Apply fine to writer
   - Reassign to different writer
   - Cancel order with refund
6. Admin documents resolution in order notes
7. All parties notified of resolution

---

## 📞 ADMIN SUPPORT ACTIONS

### For Clients:
- Answer questions about orders
- Explain pricing
- Process refunds
- Handle complaints
- Provide order updates
- Resolve payment issues

### For Writers:
- Answer questions about earnings
- Explain platform rules
- Process withdrawal requests
- Provide performance feedback
- Resolve account issues
- Offer training resources

### For Managers:
- Answer questions about their role
- Explain earnings calculation
- Help with writer management
- Resolve assignment issues
- Provide platform guidance

---

## ✅ ADMIN CHECKLIST (Daily Tasks)

**Morning**:
- [ ] Check pending orders (assign/accept if needed)
- [ ] Review withdrawal requests (approve/process)
- [ ] Check payment confirmations (distribute earnings)
- [ ] Review new user registrations (approve/reject)
- [ ] Check system notifications (errors, alerts)

**Afternoon**:
- [ ] Monitor active orders progress
- [ ] Respond to user messages/disputes
- [ ] Review completed orders (quality check)
- [ ] Process payments received
- [ ] Check writer performance metrics

**Evening**:
- [ ] Review daily statistics
- [ ] Process pending payouts
- [ ] Check orders nearing deadline
- [ ] Send reminder notifications
- [ ] Plan next day priorities

**Weekly**:
- [ ] Review financial reports
- [ ] Audit writer/manager earnings
- [ ] Check platform performance metrics
- [ ] Review and update pricing if needed
- [ ] Backup database
- [ ] Generate weekly report for stakeholders

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-17  
**Status**: Complete Reference ✅
