# WORKFLOW TESTING & VERIFICATION GUIDE
**Date**: November 22, 2025  
**Status**: Ready for User Testing

---

## 🎯 TESTING WORKFLOWS

Based on your attachment checklist, here's how to test each workflow:

### 1. ✅ VERIFY USER WORKFLOWS

#### User Registration Flow
```
Scenario: New user signs up
Steps:
  1. Go to http://localhost:5000/register
  2. Fill in:
     - Email: testuser@example.com
     - Password: Test@123456
     - Name: Test User
     - Phone: +254712345678
     - Role: Select one (Freelancer, Client, etc.)
  3. Submit registration
  4. Check email for verification code
  5. Enter code on verification page
  6. User account created
  
Expected Result:
  ✅ User created in database
  ✅ Email verified
  ✅ User can login
  ✅ Redirected to role-specific dashboard
```

#### User Login Flow
```
Scenario: User logs in
Steps:
  1. Go to http://localhost:5000/login
  2. Enter: email + password
  3. Click "Login"
  
Expected Result:
  ✅ Bearer token generated
  ✅ Stored in localStorage
  ✅ Redirected to dashboard
  ✅ Dashboard shows user's role
```

#### User Profile Management
```
Scenario: User updates profile
Steps:
  1. Login
  2. Go to profile/settings page
  3. Update: name, phone, picture
  4. Save changes
  
Expected Result:
  ✅ Changes saved to database
  ✅ Profile updated in UI
```

---

### 2. ✅ TEST CLIENT WORKFLOW

#### Client Workflow: Create Job
```
Flow:
  1. Login as Client
  2. Go to /client/dashboard
  3. Click "Post New Job"
  4. Fill in:
     - Title: "Write an essay on AI"
     - Description: Job details
     - Deadline: Select date
     - Amount: Enter price (e.g., 500 KES)
     - Upload brief (optional PDF)
  5. Click "Post Job"

Expected Results:
  ✅ Job created in database
  ✅ Job visible on dashboard
  ✅ Job appears in marketplace
  ✅ Email notification sent
  ✅ Freelancers can bid
```

#### Client Workflow: Approve Work
```
Flow:
  1. View submitted work
  2. Review freelancer's files
  3. Click "Approve" or "Request Revision"
  
Expected Results:
  ✅ If Approved:
     - Job status → "completed"
     - Payment processed
     - Invoice generated
     - Rating form appears
  ✅ If Revision Requested:
     - Job status → "revision"
     - Message sent to freelancer
     - Revision deadline set
```

---

### 3. ✅ TEST FREELANCER WORKFLOW

#### Freelancer Workflow: Upload Files
```
Flow:
  1. Login as Freelancer
  2. Go to /freelancer/jobs/[id]
  3. View job details
  4. File Upload Section:
     - Click file type dropdown
     - Select "Draft"
     - Click "Select Files"
     - Choose 1-3 PDF files
     - Click "Upload"
     - Wait for progress bar
     - Files appear in "Your Files"
  
Expected Results:
  ✅ Files upload to Cloudinary
  ✅ URLs stored in orderFiles table
  ✅ Metadata saved (filename, size, date)
  ✅ File badges show type
  ✅ Can download files
```

#### Freelancer Workflow: Submit Work
```
Flow:
  1. Upload required files:
     - At least 1 Draft
     - 1 Final Document
     - Plagiarism Report (if required)
     - AI Report (if required)
  2. "Submit Order" button appears (green)
  3. Click "Submit Order"
  4. Confirmation dialog:
     - Shows all files
     - Shows submission details
  5. Click "Confirm & Submit"
  6. Wait for success message
  
Expected Results:
  ✅ Job status → "editing"
  ✅ Upload section disabled
  ✅ Success toast message
  ✅ Admin/Client notifications sent
  ✅ Payment recorded in database
```

#### Freelancer Workflow: Track Earnings
```
Flow:
  1. Go to /freelancer/dashboard
  2. View "Earnings" widget
  3. Show:
     - Total earned
     - This month
     - Pending balance
  
Expected Results:
  ✅ Correct calculations
  ✅ Updates after payment
  ✅ History shows all transactions
```

---

### 4. ✅ TEST MANAGER WORKFLOW

#### Manager Workflow: Receive Invitation
```
Flow:
  1. Admin sends invitation to: manager@example.com
  2. Manager receives email with:
     - Verification code
     - Registration link
  3. Manager clicks link
  4. Enters verification code
  5. Completes registration:
     - Name, Password, Company
     - Phone number
  
Expected Results:
  ✅ Manager account created
  ✅ Status → "pending_approval"
  ✅ Awaits admin approval
```

#### Manager Workflow: Manage Jobs
```
Flow (after approval):
  1. Login as Manager
  2. Go to /manager/dashboard
  3. View assigned jobs
  4. For each job:
     - View freelancer submissions
     - Review quality/completeness
     - Approve or request revision
     - Add approval notes

Expected Results:
  ✅ Can see assigned jobs
  ✅ Can review submissions
  ✅ Can approve work
  ✅ Can request revisions
  ✅ Communications logged
```

---

### 5. ✅ TEST ADMIN WORKFLOW

#### Admin Workflow: Invite Manager
```
Flow:
  1. Login as Admin
  2. Go to /admin/managers (or /admin/users)
  3. Click "Invite Manager"
  4. Enter:
     - Email: newmanager@example.com
     - Role: Manager
  5. Send invitation
  
Expected Results:
  ✅ Invitation record created
  ✅ Email sent via Resend
  ✅ Verification code generated
  ✅ Expiry set (e.g., 7 days)
```

#### Admin Workflow: Approve Users
```
Flow:
  1. Go to /admin/users
  2. Filter: "Pending Approval"
  3. For each user:
     - Review details
     - Click "Approve" or "Reject"
     - Add approval notes
  
Expected Results:
  ✅ User status updated
  ✅ User can login (if approved)
  ✅ Notification sent to user
  ✅ Audit log recorded
```

#### Admin Workflow: Monitor System
```
Flow:
  1. Go to /admin/dashboard
  2. View:
     - Total users by role
     - Active jobs
     - Revenue stats
     - Recent transactions
     - System health

Expected Results:
  ✅ All stats accurate
  ✅ Updates in real-time
  ✅ Downloadable reports
```

---

## 🧪 COMPREHENSIVE TESTING MATRIX

| User Role | Workflow | Expected Status | Verified |
|-----------|----------|-----------------|----------|
| **Client** | Create job | ✅ Job created | □ |
| | Upload brief | ✅ Files stored | □ |
| | View submissions | ✅ See freelancer work | □ |
| | Approve work | ✅ Payment processed | □ |
| | Request revision | ✅ Status updated | □ |
| | Leave rating | ✅ Recorded | □ |
| **Freelancer** | View jobs | ✅ See listings | □ |
| | Accept job | ✅ Assigned | □ |
| | Upload draft | ✅ To Cloudinary | □ |
| | Upload final | ✅ To Cloudinary | □ |
| | Upload reports | ✅ All files saved | □ |
| | Submit work | ✅ Status → editing | □ |
| | Track earnings | ✅ Accurate calculation | □ |
| **Manager** | Receive invite | ✅ Email sent | □ |
| | Register | ✅ Account created | □ |
| | View assignments | ✅ Jobs visible | □ |
| | Review work | ✅ Can see files | □ |
| | Approve/Reject | ✅ Status updated | □ |
| **Admin** | Invite manager | ✅ Email sent | □ |
| | Approve user | ✅ Status updated | □ |
| | View dashboard | ✅ Stats display | □ |
| | Manage system | ✅ Settings work | □ |

---

## 🚀 PRODUCTION BUILD TEST

### Step 1: Build Application
```bash
npm run build
```
Expected output:
```
✅ Next.js build successful
✅ .next folder created
✅ Production bundle optimized
```

### Step 2: Start Production Server
```bash
npm run start
```
Expected output:
```
✅ Server listening on 0.0.0.0:5000
✅ Ready for production
✅ All routes accessible
```

### Step 3: Test in Production Mode
1. Open `http://localhost:5000`
2. Test all workflows as described above
3. Verify performance is good

---

## 📊 PERFORMANCE TESTING

### Page Load Times
| Page | Expected | Status |
|------|----------|--------|
| `/` (Home) | < 2s | □ |
| `/register` | < 1s | □ |
| `/login` | < 1s | □ |
| `/client/dashboard` | < 2s | □ |
| `/freelancer/jobs/[id]` | < 2s | □ |
| `/admin/dashboard` | < 3s | □ |

### File Upload Performance
| Test | Expected | Status |
|------|----------|--------|
| Upload 5MB file | 5-10s | □ |
| Upload 20MB file | 15-30s | □ |
| Upload 40MB file | 30-60s | □ |
| Concurrent uploads | < 5s each | □ |

---

## 🔍 ERROR HANDLING TESTS

### Test Network Errors
```
Scenario: User's internet drops during upload
Expected:
  ✅ Retry button appears
  ✅ Can resume upload
  ✅ No duplicate files created
```

### Test Invalid Input
```
Scenario: User enters invalid email
Expected:
  ✅ Error message displays
  ✅ User can correct
```

### Test File Validation
```
Scenario: User tries to upload .exe file
Expected:
  ✅ File rejected
  ✅ Error message explains
```

---

## ✅ SIGN-OFF CHECKLIST

When all tests pass, check off:

- [ ] User registration working
- [ ] User login working
- [ ] Client can create jobs
- [ ] Client can upload briefs
- [ ] Client can approve work
- [ ] Freelancer can upload files
- [ ] Freelancer can submit work
- [ ] Manager can be invited
- [ ] Manager can approve work
- [ ] Admin can invite managers
- [ ] Admin can approve users
- [ ] Admin dashboard shows correct stats
- [ ] All role-based permissions working
- [ ] Email notifications sent
- [ ] File uploads to Cloudinary
- [ ] Database updates correctly
- [ ] Production build successful
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] All workflows complete end-to-end

---

## 📞 TROUBLESHOOTING DURING TESTING

### If Upload Fails
```bash
# Check Cloudinary config
grep CLOUDINARY_ .env

# Verify API endpoint
curl -X POST http://localhost:5000/api/cloudinary/upload
```

### If Login Fails
```bash
# Check database connection
node test-db-connection.js

# Verify user exists
SELECT * FROM users WHERE email='user@example.com'
```

### If Job Creation Fails
```bash
# Check database permissions
SELECT * FROM jobs LIMIT 1

# Verify user can create
SELECT role FROM users WHERE id = [user_id]
```

### If Notifications Not Sending
```bash
# Check Resend API key
grep RESEND_API_KEY .env

# Check email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10
```

---

## 🎯 NEXT STEPS AFTER TESTING

1. **Fix any bugs found** during testing
2. **Document all workflow paths** that work
3. **Create user manual** for each role
4. **Set up monitoring** for production
5. **Configure backups** for database
6. **Plan scaling strategy** if needed

---

**Created**: November 22, 2025  
**Status**: Ready for Testing  
**All Systems**: ✅ OPERATIONAL
