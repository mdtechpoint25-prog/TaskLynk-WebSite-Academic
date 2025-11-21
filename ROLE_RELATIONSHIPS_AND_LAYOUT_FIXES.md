# Role Relationships and Layout Fixes Documentation

**Last Updated:** 2025-11-18  
**Status:** ✅ In Progress - Systematic Layout Fixes Applied

---

## 🎯 Overview

This document comprehensively details the relationships between user roles (Freelancer, Client, Admin, Manager) and documents the layout standardization applied across all dashboards.

---

## 👥 User Roles & Hierarchy

### Role Hierarchy
```
┌─────────────────────────────────────────┐
│              ADMIN                      │
│  (Super User - Full Platform Control)  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐   ┌───▼────────┐
│   MANAGER   │   │   ADMIN    │
│  (Team Lead) │   │ (Platform) │
└──────┬──────┘   └────────────┘
       │
   ┌───┴────┐
   │        │
┌──▼───┐ ┌─▼──────┐
│CLIENT│ │FREELANCER│
│(Buyer)│ │(Writer) │
└──────┘ └─────────┘
```

---

## 🔗 Detailed Role Relationships

### 1. **ADMIN** (Platform Administrator)
**Database Role:** `role = 'admin'`

#### Capabilities:
- ✅ Approve/reject user registrations (clients & freelancers)
- ✅ Approve client orders before they become available
- ✅ Assign orders to freelancers
- ✅ Review and deliver work to clients
- ✅ Cancel any order at any time
- ✅ Manage all users (view, suspend, remove)
- ✅ Approve/moderate messages between users
- ✅ Manage manager invitations
- ✅ View platform-wide analytics
- ✅ Handle payment confirmations
- ✅ Assign ratings to clients and freelancers

#### Relationships:
- **→ Clients:** Approves accounts, reviews orders, moderates communication
- **→ Freelancers:** Approves accounts, assigns jobs, reviews submissions
- **→ Managers:** Creates invitations, assigns domains, oversees management teams
- **→ Orders:** Full CRUD access, assignment control, status management

#### Key Database Tables:
- `user` (role='admin', approved=true by default)
- `orders` (adminApproved field)
- `messages` (adminApproved field for moderation)
- `manager_invitations` (manages manager onboarding)

---

### 2. **MANAGER** (Team Manager)
**Database Role:** `role = 'manager'`

#### Capabilities:
- ✅ Manage assigned clients and freelancers
- ✅ View orders for their assigned users
- ✅ Track team performance metrics
- ✅ Generate invoices for their domain
- ✅ View financial overview for their team
- ⚠️ Cannot approve new users (admin only)
- ⚠️ Cannot cancel orders (admin only)
- ⚠️ Cannot assign orders to freelancers (admin only)

#### Relationships:
- **→ Admin:** Receives invitation, reports to admin
- **→ Clients:** Manages assigned clients (via domain)
- **→ Freelancers:** Manages assigned writers (via domain)
- **→ Orders:** Views orders for assigned users only
- **→ Domain:** Belongs to a specific domain/team

#### Key Database Tables:
- `user` (role='manager', domainId foreign key)
- `domains` (domain assignment for teams)
- `manager_invitations` (invitation acceptance flow)
- `orders` (filtered by assigned user relationships)

#### Manager Registration Flow:
1. Admin creates invitation with email and domain
2. Manager receives invitation link/code
3. Manager registers with invitation code
4. Role automatically set to 'manager' and linked to domain
5. Manager gains access to assigned users in that domain

---

### 3. **CLIENT** (Order Buyer)
**Database Role:** `role = 'client'` OR `role = 'account_owner'`

#### Capabilities:
- ✅ Post new orders (with admin approval required)
- ✅ Upload files and instructions
- ✅ Set deadlines and pricing (minimum KSh 250/page, 150/slide)
- ✅ View order status and track progress
- ✅ Request revisions after delivery
- ✅ Approve completed work
- ✅ Make payments via M-Pesa
- ✅ Download final deliverables after approval
- ✅ View restricted previews before payment
- ✅ Communicate via moderated messaging
- ⚠️ Account must be approved by admin before posting orders

#### Sub-Roles:
**Regular Client** (`role = 'client'`)
- Individual users
- Auto-generated order numbers from their name
- Direct interaction with platform

**Account Owner** (`role = 'account_owner'`)
- Represents external accounts (e.g., EssayPro)
- Manual order number entry required
- Can manage sub-accounts
- Higher trust level

#### Relationships:
- **→ Admin:** Account approval, order moderation, dispute resolution
- **→ Freelancers:** Indirect relationship via orders (moderated by admin)
- **→ Managers:** May be assigned to manager's domain
- **→ Orders:** Creator and owner of orders

#### Key Database Tables:
- `user` (role='client', approved=false initially, accountId for account clients)
- `orders` (clientId foreign key, status tracking)
- `payments` (payment tracking)
- `messages` (communication with admin/freelancer)
- `files` (job attachments and deliverables)

#### Client Order Flow:
1. Register → Pending approval by admin
2. Admin approves → Can post orders
3. Post order → Pending admin approval
4. Admin approves → Order becomes available to freelancers
5. Admin assigns freelancer → Order moves to in_progress
6. Freelancer submits → Admin reviews → Delivers to client
7. Client reviews → Approves/requests revision
8. Client pays → Downloads final work
9. Order completed → Ratings assigned

---

### 4. **FREELANCER** (Writer/Service Provider)
**Database Role:** `role = 'freelancer'`

#### Capabilities:
- ✅ View available approved orders
- ✅ Place competitive bids on orders
- ✅ Work on assigned orders
- ✅ Upload drafts and final submissions
- ✅ Track earnings and balance
- ✅ Communicate via moderated messaging
- ✅ View order history and ratings
- ✅ Request draft reviews from clients
- ⚠️ Account must be approved by admin before placing bids
- ⚠️ Cannot see client orders until admin approves them
- ⚠️ Cannot contact clients directly (messages moderated)

#### Relationships:
- **→ Admin:** Account approval, order assignment, work review, payment processing
- **→ Clients:** Indirect relationship via orders (admin mediates)
- **→ Managers:** May be assigned to manager's domain
- **→ Orders:** Assigned by admin, submits work for review

#### Key Database Tables:
- `user` (role='freelancer', approved=false initially, balance tracking)
- `orders` (assignedFreelancerId foreign key)
- `bids` (competitive bidding on available orders)
- `messages` (communication with admin/client)
- `files` (submissions and revisions)

#### Freelancer Order Flow:
1. Register → Pending approval by admin
2. Admin approves → Can view available orders
3. Place bids on interesting orders
4. Admin assigns order → Moves to in_progress
5. Work on order → Upload draft (if requested)
6. Submit final work → Admin reviews
7. Admin delivers to client → Freelancer waits for approval
8. Client approves → Balance credited automatically
9. Ratings assigned by admin

---

## 📊 Order Workflow & Status Flow

### Complete Order Lifecycle
```
CLIENT               ADMIN              FREELANCER          STATUS
  │                    │                     │
  ├─Post Order────────>│                     │           pending
  │                    │                     │
  │                    ├─Review & Approve───>│           approved
  │                    │                     │
  │                    │                     ├─View & Bid  available
  │                    │                     │
  │                    ├─Assign to Writer───>│           assigned
  │                    │                     │
  │                    │                     ├─Accept Job  on_hold
  │                    │                     │
  │                    │                     ├─Start Work  in_progress
  │                    │                     │
  │                    │                     ├─Submit Work editing
  │                    │                     │
  │                    ├─Review Submission   │
  │                    │                     │
  ├─Receive Delivery───┤                     │           delivered
  │                    │                     │
  ├─Approve/Revision   │                     │           approved/revision
  │                    │                     │
  ├─Make Payment──────>│                     │           paid
  │                    │                     │
  │                    ├─Confirm Payment────>│           completed
  │                    │                     │           (Balance+)
  ▼                    ▼                     ▼
```

### Status Definitions

| Status | Visible To | Description |
|--------|-----------|-------------|
| **pending** | Client, Admin | Order awaiting admin approval |
| **approved** | Admin, Freelancer | Order approved, ready for assignment |
| **available** | Freelancer | Order open for bidding |
| **assigned** | All | Order assigned to freelancer |
| **on_hold** | All | Order temporarily paused |
| **in_progress** | All | Freelancer actively working |
| **editing** | Admin, Freelancer | Submitted, awaiting admin review |
| **delivered** | Client, Admin | Delivered to client for approval |
| **revision** | All | Client requested changes |
| **approved** | All | Client approved the work |
| **paid** | All | Payment confirmed by admin |
| **completed** | All | Fully completed, balance credited |
| **cancelled** | All | Order cancelled by admin |

---

## 💰 Financial Relationships

### Payment Flow
```
CLIENT PAYMENT → ADMIN CONFIRMATION → FREELANCER BALANCE

1. Client pays via M-Pesa (KSh amount)
2. Admin confirms payment received
3. System auto-calculates freelancer earnings:
   - Standard: 150 KSh/page, 90 KSh/slide
   - AI Removal: 60 KSh/page, 30 KSh/slide
   - Proofreading: 30 KSh/page
   - Plag Report: 30 KSh flat
4. Balance credited to freelancer account
5. Freelancer can request payout
6. Admin processes payout request
```

### Pricing Structure

**Client Pricing (Minimum):**
- Pages: 250 KSh per page (double-spaced)
- Pages (Single-spaced): 500 KSh per page (2× multiplier)
- Slides: 150 KSh per slide

**Freelancer Earnings:**
- Standard Writing: 150 KSh/page, 90 KSh/slide
- Technical Writing: 230 KSh/page
- AI Removal: 60 KSh/page, 30 KSh/slide
- Proofreading: 30 KSh/page
- Plagiarism Report: 30 KSh flat rate

**Platform Margin:**
- Client pays 250 KSh/page → Freelancer gets 150 KSh = 100 KSh margin (40%)
- Adjusts based on service type and complexity

---

## 📂 Database Schema Relationships

### Core Tables

```sql
-- Users (all roles)
user
├── id (primary key)
├── email
├── name
├── role (client|freelancer|admin|manager|account_owner)
├── approved (boolean)
├── balance (decimal, for freelancers)
├── domainId (foreign key for managers)
└── accountId (foreign key for account clients)

-- Orders (central entity)
orders
├── id (primary key)
├── clientId (→ user.id)
├── assignedFreelancerId (→ user.id)
├── title
├── instructions
├── workType
├── pages/slides
├── amount (client pays)
├── writerTotal (freelancer earns)
├── deadline
├── actualDeadline
├── freelancerDeadline (60% of time)
├── status
├── adminApproved (boolean)
├── accountOrderNumber (for account clients)
├── singleSpaced (boolean)
├── baseCpp/effectiveCpp (pricing metadata)
└── timestamps

-- Bids (freelancer competition)
bids
├── id (primary key)
├── jobId (→ orders.id)
├── freelancerId (→ user.id)
├── bidAmount
├── message
├── status (pending|accepted|rejected)
└── createdAt

-- Messages (moderated communication)
messages
├── id (primary key)
├── senderId (→ user.id)
├── receiverId (→ user.id)
├── jobId (→ orders.id, optional)
├── content
├── adminApproved (boolean)
└── createdAt

-- Files (attachments & deliverables)
files
├── id (primary key)
├── orderId (→ orders.id)
├── uploadedBy (→ user.id)
├── fileName
├── fileUrl
├── fileType
├── uploadType (initial|draft|final|revision)
└── createdAt

-- Manager Invitations
manager_invitations
├── id (primary key)
├── email
├── domainId (→ domains.id)
├── code (unique invitation code)
├── status (pending|accepted|expired)
└── createdAt

-- Domains (manager teams)
domains
├── id (primary key)
├── name
├── managerId (→ user.id)
└── createdAt

-- Payments
payments
├── id (primary key)
├── orderId (→ orders.id)
├── clientId (→ user.id)
├── amount
├── method (mpesa)
├── transactionId
├── status (pending|confirmed|failed)
└── createdAt

-- Payout Requests
payout_requests
├── id (primary key)
├── freelancerId (→ user.id)
├── amount
├── method
├── status (pending|approved|processed|rejected)
└── timestamps
```

---

## 🎨 Unified Layout Structure

### Standardized Dashboard Layout

**All role dashboards now follow this consistent structure:**

```jsx
<div className="min-h-screen flex bg-background">
  {/* Fixed Top Navigation - 72px height */}
  <DashboardNav 
    onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
    sidebarOpen={sidebarOpen} 
  />
  
  {/* Fixed Sidebar - 256px width (w-64) */}
  <RoleSidebar 
    isOpen={sidebarOpen} 
    onClose={() => setSidebarOpen(false)} 
  />
  
  {/* Scrollable Main Content */}
  <main className="flex-1 pt-[72px] ml-0 md:ml-64 bg-background transition-all duration-300">
    <div className="p-3 md:p-4 lg:p-5 w-full">
      {/* Page content */}
    </div>
  </main>
</div>
```

### Layout Specifications

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| **Navbar Height** | 72px | 72px | Fixed top |
| **Sidebar Width** | 256px (w-64) | Full overlay | Hidden on mobile |
| **Main Top Padding** | 72px | 72px | Clears navbar |
| **Main Left Margin** | 256px (md:ml-64) | 0px (ml-0) | Responsive |
| **Breakpoint** | 768px (md:) | < 768px | Sidebar toggle point |

### Responsive Behavior

**Desktop (≥768px):**
- Sidebar always visible (w-64 fixed)
- Main content has left margin (md:ml-64)
- Sidebar position: sticky/fixed

**Mobile (<768px):**
- Sidebar hidden by default (ml-0)
- Sidebar opens as overlay (z-50)
- Dark overlay behind sidebar
- Close button visible in sidebar
- Hamburger menu in navbar toggles sidebar

---

## ✅ Layout Fixes Applied

### Pages Fixed (Progress Tracking)

#### **Freelancer Pages** (19 total)
- ✅ `/freelancer/dashboard` - Fixed
- ✅ `/freelancer/jobs` - Fixed
- ✅ `/freelancer/messages` - Fixed
- ✅ `/freelancer/orders` - Fixed
- ⏳ `/freelancer/bids` - Pending
- ⏳ `/freelancer/financial-overview` - Pending
- ⏳ `/freelancer/settings` - Pending
- ⏳ `/freelancer/guide` - Pending
- ⏳ `/freelancer/approved` - Pending
- ⏳ `/freelancer/cancelled` - Pending
- ⏳ `/freelancer/completed` - Pending
- ⏳ `/freelancer/delivered` - Pending
- ⏳ `/freelancer/done` - Pending
- ⏳ `/freelancer/editing` - Pending
- ⏳ `/freelancer/in-progress` - Pending
- ⏳ `/freelancer/on-hold` - Pending
- ⏳ `/freelancer/revision` - Pending
- ⏳ `/freelancer/jobs/[id]` - Pending
- ⏳ `/freelancer/orders/[id]` - Pending

#### **Client Pages** (18 total)
- ✅ `/client/dashboard` - Fixed
- ✅ `/client/jobs` - Fixed
- ✅ `/client/new-job` - Fixed (already had correct layout)
- ⏳ `/client/messages` - Pending
- ⏳ `/client/financial-overview` - Pending
- ⏳ `/client/settings` - Pending
- ⏳ `/client/accepted` - Pending
- ⏳ `/client/approved` - Pending
- ⏳ `/client/cancelled` - Pending
- ⏳ `/client/completed` - Pending
- ⏳ `/client/delivered` - Pending
- ⏳ `/client/in-progress` - Pending
- ⏳ `/client/on-hold` - Pending
- ⏳ `/client/paid` - Pending
- ⏳ `/client/pending` - Pending
- ⏳ `/client/revisions` - Pending
- ⏳ `/client/jobs/[id]` - Pending
- ⏳ `/client/account-owner-setup` - Pending

#### **Admin Pages** (22 total)
- ✅ `/admin/dashboard` - Fixed
- ✅ `/admin/jobs` - Fixed
- ✅ `/admin/user-management` - Fixed
- ⏳ `/admin/managers` - Pending
- ⏳ `/admin/messages` - Pending
- ⏳ `/admin/payments` - Pending
- ⏳ `/admin/payouts` - Pending
- ⏳ `/admin/performance` - Pending
- ⏳ `/admin/progress` - Pending
- ⏳ `/admin/revisions` - Pending
- ⏳ `/admin/settings` - Pending
- ⏳ `/admin/users` - Pending
- ⏳ `/admin/audit-logs` - Pending
- ⏳ `/admin/emails` - Pending
- ⏳ `/admin/domains` - Pending
- ⏳ `/admin/storage-setup` - Pending
- ⏳ `/admin/jobs/[id]` - Pending
- ⏳ `/admin/jobs/accepted` - Pending
- ⏳ `/admin/jobs/approved` - Pending
- ⏳ `/admin/jobs/paid` - Pending
- ⏳ `/admin/domains/[id]` - Pending
- ⏳ `/admin/users/managers` - Pending

#### **Manager Pages** (All Fixed Previously)
- ✅ `/manager/dashboard` - Fixed
- ✅ `/manager/orders/...` - Fixed
- ✅ `/manager/clients/...` - Fixed
- ✅ `/manager/writers/...` - Fixed

---

## 🔑 Key Takeaways

### Role Separation of Concerns

1. **Admin = Orchestrator**
   - Approves everything
   - Assigns work
   - Mediates disputes
   - Controls platform

2. **Manager = Team Lead**
   - Oversees subset of users
   - Tracks performance
   - Generates reports
   - Cannot make platform-level changes

3. **Client = Buyer**
   - Posts orders
   - Pays for work
   - Approves deliverables
   - Limited to own orders

4. **Freelancer = Provider**
   - Bids competitively
   - Delivers work
   - Earns from completions
   - Limited to assigned orders

### Communication Flow

All communication is **admin-moderated**:
```
Client → Message → Admin Approval → Freelancer
Freelancer → Message → Admin Approval → Client
```

### Order Assignment Logic

Orders cannot be self-assigned:
```
1. Client posts → Pending admin approval
2. Admin approves → Available to all freelancers
3. Freelancers bid → Admin reviews bids
4. Admin assigns → Specific freelancer gets order
5. Others no longer see it
```

---

## 📝 Notes

- **Account Hierarchy:** Account owners can have multiple clients under them
- **Domain Hierarchy:** Managers oversee specific domains with assigned users
- **Balance Tracking:** Only freelancers have balance field
- **Approval Gates:** Both clients and freelancers need admin approval before core actions
- **Payment Flow:** All payments go through admin confirmation
- **Deadline Calculation:** Freelancers get 60% of total time as their deadline

---

## 🚀 Next Steps

1. ✅ Complete layout fixes for remaining freelancer pages
2. ✅ Complete layout fixes for remaining client pages  
3. ✅ Complete layout fixes for remaining admin pages
4. ✅ Test responsive behavior across all viewports
5. ✅ Verify sidebar toggle functionality
6. ✅ Confirm navigation consistency

---

**End of Documentation**
