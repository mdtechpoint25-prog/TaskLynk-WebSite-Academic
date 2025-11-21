# NEW API SYSTEM IMPLEMENTATION COMPLETE

## ✅ What's Been Implemented

### 1. **Fresh Database Schema** (schema-new.ts)
- **12 core tables** with proper relationships
- **New pricing rules** enforced at database level
- **NO 70% calculations** anywhere
- **Balance tracking** (available, pending, total_earned)
- **Order lifecycle** with proper status management
- **Manager earnings** calculated correctly

### 2. **Complete API Endpoints** (/api/v2/)

#### Order Lifecycle APIs:
- **POST /api/v2/orders** - Create order
  - Enforces minimum pricing (240 KSh/page writing, 150 KSh/slide)
  - Auto-calculates writer earnings (200/230/100 based on work type)
  - Generates unique order number
  - Creates financial record

- **GET /api/v2/orders** - List orders (role-based filtering)
  - Admin: sees all orders
  - Client: sees their own orders
  - Freelancer: sees assigned orders
  - Manager: sees managed orders

- **GET /api/v2/orders/[id]** - Get order details with financials

- **POST /api/v2/orders/[id]/assign** - Assign order to writer
  - Manager earns 10 KSh immediately
  - Updates order status to 'assigned'
  - Records in order_financials

- **POST /api/v2/orders/[id]/submit** - Writer submits order
  - Manager earns: 10 + ((pages-1) * 5)
  - Updates order status to 'submitted'
  - Prevents multiple submissions

- **POST /api/v2/orders/[id]/approve** - Client approves order
  - Changes status to 'approved'
  - Ready for payment

- **POST /api/v2/orders/[id]/payment** - Confirm payment & distribute balances
  - **CRITICAL**: Balances update ONLY here when status = 'paid'
  - Writer gets: writer_cpp × units
  - Manager gets: assignment fee + submission fee
  - Platform fee calculated automatically
  - Creates payment record
  - Logs all transactions

#### Message APIs:
- **GET /api/v2/messages** - Get messages (filtered for non-admins)
- **POST /api/v2/messages** - Send message (pending approval)
- **POST /api/v2/messages/[id]/approve** - Admin approves message

#### Rating APIs:
- **GET /api/v2/ratings?userId={id}** - Get user ratings
- **POST /api/v2/ratings** - Submit rating (updates user average rating)

#### File APIs:
- **GET /api/v2/files?orderId={id}** - List order files
- **POST /api/v2/files** - Upload file (requirement, submission, revision, final)
- **GET /api/v2/files/[id]** - Get file details
- **DELETE /api/v2/files/[id]** - Delete file

#### Balance APIs:
- **GET /api/v2/users/[id]/balance** - Get balance and transaction history

---

## 📊 Pricing System (NEW - NO 70% RULE)

### Client Minimum Pricing:
- **Writing/Technical/Excel**: 240 KSh/page minimum
- **Slides**: 150 KSh/slide minimum

### Writer Earnings:
- **Writing**: 200 KSh/page
- **Technical**: 230 KSh/page
- **Slides**: 100 KSh/slide
- **Excel**: 200 KSh/page

### Manager Earnings:
- **On Assignment**: 10 KSh (flat fee)
- **On Submission**: 10 + ((pages - 1) × 5) KSh
  - Example: 5 pages = 10 + (4 × 5) = 30 KSh

### Platform Fee:
- **Auto-calculated**: Client Total - Writer Total - Manager Total

---

## 🔄 Complete Order Lifecycle

```
1. CLIENT creates order → status: 'pending'
   - Must meet minimum pricing
   - Auto-calculates all amounts

2. MANAGER assigns to writer → status: 'assigned'
   - Manager earns 10 KSh immediately
   - Order assigned to specific writer

3. WRITER submits order → status: 'submitted'
   - Manager earns submission fee
   - Marks order as submitted

4. CLIENT approves order → status: 'approved'
   - Client satisfied with work
   - Ready for payment

5. ADMIN confirms payment → status: 'paid'
   - **BALANCES UPDATE HERE**
   - Writer receives earnings
   - Manager receives total fees
   - Platform fee calculated
   - Transaction logs created

6. CLIENT can rate writer
   - Updates writer's average rating
```

---

## 🚧 NEXT STEPS REQUIRED

### 1. **Update Auth Context** (/src/lib/auth-context.tsx)
Currently uses old database schema. Needs to:
- Switch from `src/db/schema.ts` to `src/db/schema-new.ts`
- Update login/register to use new users table structure
- Handle new status field ('pending', 'approved', etc.)
- Update role references (roleId instead of role string)

### 2. **Update All Dashboard Pages**

#### Client Dashboard:
- [ ] `/client/dashboard/page.tsx` - Use new API endpoints
- [ ] `/client/new-job/page.tsx` - Enforce new pricing rules
- [ ] `/client/pending/page.tsx` - Update to new schema
- [ ] `/client/in-progress/page.tsx` - Update to new schema
- [ ] `/client/completed/page.tsx` - Update to new schema
- [ ] `/client/financial-overview/page.tsx` - Show new pricing breakdown

#### Freelancer Dashboard:
- [ ] `/freelancer/dashboard/page.tsx` - Use new API endpoints
- [ ] `/freelancer/jobs/page.tsx` - Show available orders
- [ ] `/freelancer/in-progress/page.tsx` - Update to new schema
- [ ] `/freelancer/completed/page.tsx` - Update to new schema
- [ ] `/freelancer/financial-overview/page.tsx` - Show new earnings

#### Manager Dashboard:
- [ ] `/manager/dashboard/page.tsx` - Use new API endpoints
- [ ] `/manager/orders/page.tsx` - Show managed orders
- [ ] `/manager/payments/page.tsx` - Show earnings breakdown

#### Admin Dashboard:
- [ ] `/admin/dashboard/page.tsx` - Use new API endpoints
- [ ] `/admin/jobs/page.tsx` - All orders management
- [ ] `/admin/payments/page.tsx` - Payment confirmations
- [ ] `/admin/users/page.tsx` - User management

### 3. **Remove All Old Logic**
Search and remove:
- [ ] All instances of "70%" or "0.7" calculations
- [ ] Old payment distribution logic
- [ ] Old API endpoints that use old schema
- [ ] Old balance calculation methods

### 4. **Test Complete Lifecycle**
With test user (test@tasklynk.com / test123):
- [ ] Create order as client
- [ ] Assign order as manager
- [ ] Submit order as writer
- [ ] Approve order as client
- [ ] Confirm payment as admin
- [ ] Verify balances updated correctly
- [ ] Test messaging system
- [ ] Test file uploads
- [ ] Test rating system

---

## 🧪 Testing the APIs

Use the test user credentials:
- **Email**: test@tasklynk.com
- **Password**: test123
- **Role**: Admin (approved)
- **Also in managers table**

### Example API Tests:

```bash
# 1. Create Order (as client)
curl -X POST http://localhost:3000/api/v2/orders \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "title": "Test Order",
    "workType": "writing",
    "pageCount": 5,
    "clientCpp": 250,
    "deadline": "2025-12-31"
  }'

# 2. Assign Order (as manager)
curl -X POST http://localhost:3000/api/v2/orders/1/assign \
  -H "Content-Type: application/json" \
  -d '{
    "managerId": 1,
    "writerId": 2
  }'

# 3. Submit Order (as writer)
curl -X POST http://localhost:3000/api/v2/orders/1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "writerId": 2
  }'

# 4. Approve Order (as client)
curl -X POST http://localhost:3000/api/v2/orders/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1
  }'

# 5. Confirm Payment (as admin)
curl -X POST http://localhost:3000/api/v2/orders/1/payment \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": 1,
    "transactionId": "TEST123",
    "paymentMethod": "mpesa"
  }'

# 6. Check Balance
curl http://localhost:3000/api/v2/users/2/balance
```

---

## ⚠️ CRITICAL NOTES

1. **Balance Updates**: Balances ONLY update when payment is confirmed (status = 'paid')
2. **No 70% Rule**: Completely removed - writer earnings are fixed rates
3. **Manager Earnings**: Split into assignment (10) + submission (10 + (pages-1)*5)
4. **Minimum Pricing**: Enforced at API level - cannot create orders below minimum
5. **Message Approval**: All messages require admin approval before being visible
6. **Rating System**: Only works after order is paid
7. **Transaction Logs**: Every balance change is logged with before/after amounts

---

## 📁 File Structure

```
src/
├── db/
│   ├── schema.ts (OLD - still used by auth)
│   └── schema-new.ts (NEW - used by v2 APIs)
├── app/
│   └── api/
│       └── v2/ (NEW API endpoints)
│           ├── orders/
│           │   ├── route.ts (list, create)
│           │   └── [id]/
│           │       ├── route.ts (get details)
│           │       ├── assign/route.ts
│           │       ├── submit/route.ts
│           │       ├── approve/route.ts
│           │       └── payment/route.ts
│           ├── messages/
│           │   ├── route.ts
│           │   └── [id]/approve/route.ts
│           ├── ratings/
│           │   └── route.ts
│           ├── files/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           └── users/
│               └── [id]/balance/route.ts
```

---

## 🎯 Priority Actions

1. **IMMEDIATE**: Update auth context to use schema-new.ts
2. **HIGH**: Update client dashboard to create orders with new pricing
3. **HIGH**: Update admin dashboard to confirm payments
4. **MEDIUM**: Update all other dashboards
5. **LOW**: Remove old API endpoints and logic

---

## 💡 Tips for Integration

- All new APIs return consistent JSON format
- Error messages are descriptive
- Status codes follow REST conventions
- Transaction logs provide audit trail
- Order history tracks all actions
- Financial records separate from orders for clarity

Would you like me to proceed with updating the dashboards and auth context?
