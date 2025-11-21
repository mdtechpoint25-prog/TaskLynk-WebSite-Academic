# ORDER LIFECYCLE TESTING GUIDE

## 🧪 Complete Testing Instructions for Order Lifecycle System

This guide provides step-by-step instructions to test all order lifecycle transitions with proper verification of manager earnings, writer earnings, and status changes.

---

## 📋 Prerequisites

Before testing, ensure you have:
1. Admin user account (role='admin')
2. Manager user account (role='manager')
3. Client user account (role='client')
4. Writer/Freelancer user account (role='freelancer')
5. Bearer tokens for authentication stored in localStorage

---

## ✅ TEST SCENARIO 1: Complete Happy Path (No Revisions)

### Step 1: Create Order (Client)
```javascript
// Client creates a new order
const response = await fetch('/api/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${clientToken}`
  },
  body: JSON.stringify({
    title: 'Test Order - Complete Flow',
    instructions: 'This is a test order for lifecycle testing',
    workType: 'writing',
    pages: 5,
    amount: 1250, // 5 pages × 250 KSh/page
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  })
});

const { job } = await response.json();
const jobId = job.id;

// ✅ Verify: status = 'pending'
console.log('Status:', job.status); // Should be 'pending'
```

### Step 2: Manager Accepts Order
```javascript
const response = await fetch(`/api/jobs/${jobId}/accept`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${managerToken}`
  },
  body: JSON.stringify({
    managerId: managerUserId
  })
});

const { job } = await response.json();

// ✅ Verify: status = 'accepted'
console.log('Status:', job.status); // Should be 'accepted'

// ✅ Verify: jobStatusLogs entry created
// Check database: SELECT * FROM jobStatusLogs WHERE job_id = ? ORDER BY created_at DESC
```

### Step 3: Manager Assigns Writer
```javascript
const response = await fetch(`/api/jobs/${jobId}/assign`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${managerToken}`
  },
  body: JSON.stringify({
    freelancerId: writerUserId,
    changedBy: managerUserId
  })
});

const { job } = await response.json();

// ✅ Verify: status = 'assigned'
console.log('Status:', job.status); // Should be 'assigned'
console.log('Assigned Writer ID:', job.assignedFreelancerId);

// ✅ Verify: Manager earned 10 KSh
// Check database:
// SELECT * FROM manager_earnings WHERE job_id = ? AND earning_type = 'assign'
// Expected: 1 record with amount = 10

// ✅ Verify: Manager balance increased by 10
// SELECT balance, total_earned FROM users WHERE id = ?
```

### Step 4: Writer Uploads Final Files
```javascript
// First, writer must upload at least one FINAL file
const formData = new FormData();
formData.append('file', fileBlob, 'completed-work.pdf');
formData.append('uploadType', 'final');

const uploadResponse = await fetch(`/api/jobs/${jobId}/attachments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${writerToken}`
  },
  body: formData
});

// ✅ Verify: File uploaded successfully
const { attachment } = await uploadResponse.json();
console.log('Uploaded file:', attachment);
```

### Step 5: Writer Submits Work
```javascript
const response = await fetch(`/api/jobs/${jobId}/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${writerToken}`
  }
});

const { job, message } = await response.json();

// ✅ Verify: status = 'editing'
console.log('Status:', job.status); // Should be 'editing'
console.log('Message:', message);

// ✅ Verify: jobStatusLogs entry created
// Check: old_status = 'assigned', new_status = 'editing'
```

### Step 6: Manager Delivers to Client
```javascript
const response = await fetch(`/api/jobs/${jobId}/deliver`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${managerToken}`
  },
  body: JSON.stringify({
    managerId: managerUserId
  })
});

const { job, managerEarnings } = await response.json();

// ✅ Verify: status = 'delivered'
console.log('Status:', job.status); // Should be 'delivered'

// ✅ Verify: Manager submission earnings calculated correctly
// Formula: 10 + (5 × (pages - 1))
// For 5 pages: 10 + (5 × 4) = 30 KSh
console.log('Manager Earnings:', managerEarnings); // Should be 30

// ✅ Verify: Manager earnings record created
// SELECT * FROM manager_earnings WHERE job_id = ? AND earning_type = 'submit'
// Expected: 1 record with amount = 30

// ✅ Verify: Manager balance increased by 30
// Check cumulative manager balance includes both assign (10) + submit (30) = 40 KSh
```

### Step 7: Client Approves Work
```javascript
const response = await fetch(`/api/jobs/${jobId}/approve-by-client`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${clientToken}`
  },
  body: JSON.stringify({
    clientId: clientUserId
  })
});

const { job } = await response.json();

// ✅ Verify: status = 'approved'
console.log('Status:', job.status); // Should be 'approved'

// ✅ Verify: client_approved flag set
console.log('Client Approved:', job.clientApproved); // Should be 1 or true

// ✅ Verify: Notification created for admin and writer
```

### Step 8: Admin Confirms Payment
```javascript
const response = await fetch(`/api/jobs/${jobId}/confirm-payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    adminId: adminUserId,
    transactionId: 'MPESA12345678',
    paymentMethod: 'mpesa',
    phoneNumber: '0701066845'
  })
});

const { job, distribution } = await response.json();

// ✅ Verify: status = 'completed' (auto-moved after payment)
console.log('Status:', job.status); // Should be 'completed'

// ✅ Verify: payment_confirmed flag set
console.log('Payment Confirmed:', job.paymentConfirmed); // Should be 1 or true

// ✅ Verify: Earnings distribution
console.log('Distribution:', distribution);
// Expected:
// {
//   writer: 1000,  // 5 pages × 200 KSh/page
//   manager: 40,   // 10 (assign) + 30 (submit)
//   total: 1250    // client amount
// }

// ✅ Verify: Writer balance increased by freelancerEarnings
// SELECT balance, total_earned FROM users WHERE id = ?
// Expected: balance += 1000, total_earned += 1000

// ✅ Verify: Payment record created
// SELECT * FROM payments WHERE job_id = ?
// Expected: status = 'completed', confirmed_by_admin = 1

// ✅ Verify: Status logs show paid → completed transition
// SELECT * FROM jobStatusLogs WHERE job_id = ? ORDER BY created_at DESC LIMIT 2
```

---

## ✅ TEST SCENARIO 2: Revision Flow

Follow Steps 1-6 from Scenario 1, then:

### Step 7 (Alt): Client Requests Revision
```javascript
const response = await fetch(`/api/jobs/${jobId}/request-revision`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${clientToken}`
  },
  body: JSON.stringify({
    clientId: clientUserId,
    revisionNotes: 'Please adjust the conclusion section and add more references'
  })
});

const { job } = await response.json();

// ✅ Verify: status = 'revision'
console.log('Status:', job.status); // Should be 'revision'

// ✅ Verify: revision_requested flag set
console.log('Revision Requested:', job.revisionRequested); // Should be 1 or true

// ✅ Verify: revision_notes saved
console.log('Revision Notes:', job.revisionNotes);

// ✅ Verify: Writer notified
```

### Step 8: Writer Re-submits (After Revisions)
```javascript
// Writer uploads revised files
const formData = new FormData();
formData.append('file', revisedFileBlob, 'revised-work.pdf');
formData.append('uploadType', 'final');

await fetch(`/api/jobs/${jobId}/attachments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${writerToken}`
  },
  body: formData
});

// Writer submits revised work
const response = await fetch(`/api/jobs/${jobId}/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${writerToken}`
  }
});

const { job } = await response.json();

// ✅ Verify: status = 'editing'
console.log('Status:', job.status); // Should be 'editing'
```

### Step 9: Manager Re-delivers
```javascript
// Manager delivers revised work to client
const response = await fetch(`/api/jobs/${jobId}/deliver`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${managerToken}`
  },
  body: JSON.stringify({
    managerId: managerUserId
  })
});

const { job, managerEarnings } = await response.json();

// ✅ Verify: status = 'delivered'
console.log('Status:', job.status); // Should be 'delivered'

// ⚠️ IMPORTANT: Manager does NOT earn additional submission fee for revisions
// This is a re-delivery of the same order
console.log('Manager Earnings:', managerEarnings);
```

Continue with client approval and payment confirmation as in Scenario 1.

---

## ✅ TEST SCENARIO 3: On Hold Flow

At any point before completion:

### Put Order On Hold
```javascript
const response = await fetch(`/api/jobs/${jobId}/hold`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${managerToken}` // or adminToken
  },
  body: JSON.stringify({
    managerId: managerUserId, // or adminId
    reason: 'Waiting for client to provide additional information'
  })
});

const { job } = await response.json();

// ✅ Verify: status = 'on_hold'
console.log('Status:', job.status); // Should be 'on_hold'

// ✅ Verify: All involved parties notified (client, writer, manager)

// ✅ Verify: Order can be resumed by updating status back to appropriate state
// Use generic status update endpoint: PATCH /api/jobs/[id]/status
```

### Resume Order from On Hold
```javascript
const response = await fetch(`/api/jobs/${jobId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    status: 'assigned', // or whatever status is appropriate
    changedBy: adminUserId
  })
});

// ✅ Verify: status updated and work can continue
```

---

## ✅ TEST SCENARIO 4: Cancellation

### Cancel Order (Admin Only)
```javascript
const response = await fetch(`/api/jobs/${jobId}/cancel`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    adminId: adminUserId,
    reason: 'Client requested cancellation'
  })
});

const { job } = await response.json();

// ✅ Verify: status = 'cancelled'
console.log('Status:', job.status); // Should be 'cancelled'

// ✅ Verify: All involved parties notified

// ⚠️ Verify: Cannot cancel if status is 'completed' or 'paid'
// Should return error with code 'INVALID_STATUS'
```

---

## 🔍 VERIFICATION CHECKLIST

### For Each Status Transition, Verify:

1. **Status Update**
   - [ ] Job status updated correctly in database
   - [ ] Updated timestamp set

2. **Order History Log**
   - [ ] Entry created in jobStatusLogs table
   - [ ] old_status and new_status correct
   - [ ] changed_by user ID recorded
   - [ ] Descriptive note included

3. **Manager Earnings (where applicable)**
   - [ ] Record created in manager_earnings table
   - [ ] earning_type correct ('assign' or 'submit')
   - [ ] amount calculated correctly
   - [ ] Manager balance updated
   - [ ] Manager total_earned updated

4. **Writer Earnings (on payment confirmation)**
   - [ ] Writer balance increased by freelancerEarnings
   - [ ] Writer total_earned updated
   - [ ] Notification sent to writer

5. **Notifications**
   - [ ] All relevant parties notified
   - [ ] Notification type correct
   - [ ] Notification message descriptive

6. **Payment Records (on payment confirmation)**
   - [ ] Payment record created/updated
   - [ ] Status set to 'completed'
   - [ ] confirmed_by_admin flag set
   - [ ] Transaction details saved

---

## 📊 DATABASE QUERIES FOR VERIFICATION

### Check Order Status History
```sql
SELECT * FROM jobStatusLogs 
WHERE job_id = ? 
ORDER BY created_at ASC;
```

### Check Manager Earnings for Order
```sql
SELECT 
  me.*,
  u.name as manager_name
FROM manager_earnings me
JOIN users u ON u.id = me.manager_id
WHERE me.job_id = ?
ORDER BY me.created_at ASC;
```

### Check Total Manager Earnings
```sql
SELECT 
  manager_id,
  SUM(CASE WHEN earning_type = 'assign' THEN amount ELSE 0 END) as assign_total,
  SUM(CASE WHEN earning_type = 'submit' THEN amount ELSE 0 END) as submit_total,
  SUM(amount) as total_earnings
FROM manager_earnings
WHERE job_id = ?
GROUP BY manager_id;
```

### Check User Balance Changes
```sql
SELECT 
  id,
  name,
  role,
  balance,
  total_earned,
  updated_at
FROM users
WHERE id IN (?, ?, ?); -- manager_id, writer_id, client_id
```

### Check Payment Records
```sql
SELECT * FROM payments 
WHERE job_id = ?
ORDER BY created_at DESC;
```

### Check Notifications Sent
```sql
SELECT 
  n.*,
  u.name as recipient_name,
  u.role as recipient_role
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.job_id = ?
ORDER BY n.created_at ASC;
```

---

## 🎯 EXPECTED RESULTS SUMMARY

### For 5-Page Order (Complete Flow):

**Client Pays**: 1,250 KSh (5 pages × 250 KSh/page)

**Distribution**:
- Writer Earns: 1,000 KSh (5 pages × 200 KSh/page)
- Manager Earns: 40 KSh
  - Assignment: 10 KSh
  - Submission: 30 KSh [10 + (5 × 4)]
- Platform Fee: 210 KSh (1,250 - 1,000 - 40)

**Status Progression**:
1. pending
2. accepted
3. assigned (Manager +10 KSh)
4. editing
5. delivered (Manager +30 KSh)
6. approved
7. paid (Writer +1,000 KSh)
8. completed

**Total Logs**: 7 entries in jobStatusLogs
**Total Notifications**: ~15-20 (depending on roles involved)
**Manager Earnings Records**: 2 (assign + submit)
**Payment Records**: 1 (final payment)

---

## 🚨 COMMON ISSUES & TROUBLESHOOTING

### Issue 1: "Cannot submit without FINAL files"
**Solution**: Writer must upload at least one file with uploadType='final' before submitting.

### Issue 2: "Invalid status transition"
**Solution**: Check ALLOWED_TRANSITIONS in /api/jobs/[id]/status/route.ts. Some transitions are not allowed.

### Issue 3: Manager earnings not credited
**Solution**: 
- Check manager_id is correctly passed in request
- Verify managerEarnings table exists
- Check users table has balance and totalEarned columns
- Review database triggers or constraints

### Issue 4: Writer not seeing assigned order
**Solution**: 
- Verify writer's role is 'freelancer'
- Check assignedFreelancerId is set correctly in jobs table
- Ensure status is 'assigned' or later

### Issue 5: "Cannot approve order in status: X"
**Solution**: Client can only approve orders in 'delivered' status. Ensure proper status progression.

---

## ✅ TESTING COMPLETE

After running all test scenarios, verify:
- [x] All API endpoints respond correctly
- [x] Status transitions follow lifecycle rules
- [x] Manager earnings calculated and credited accurately
- [x] Writer earnings distributed on payment confirmation
- [x] Order history logged for all transitions
- [x] Notifications sent to all relevant parties
- [x] Payment records created properly
- [x] Role-based status visibility working

---

**Testing Version**: 1.0.0  
**Last Updated**: 2025-11-17  
**Status**: Ready for Testing ✅
