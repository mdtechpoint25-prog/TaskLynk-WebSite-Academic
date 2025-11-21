# CRITICAL NEXT STEPS - IMPLEMENTATION ROADMAP

## ✅ COMPLETED
1. Fixed user status to change to 'active' after approval
2. Enabled client order editing with proper authorization
3. Created comprehensive workflow documentation
4. Verified "Accept" endpoint exists at `/api/jobs/[id]/accept`

## ⏳ IMMEDIATE ACTIONS REQUIRED

### Step 1: Create Assign Freelancer Endpoint
**File to create**: `src/app/api/jobs/[id]/assign/route.ts`

```typescript
// POST /api/jobs/[id]/assign
// Request body: { freelancerId: number, managerId: number }
// Updates job: status = "assigned", assignedFreelancerId = freelancerId
// Notifies: Freelancer that they've been assigned work
// Response: { success: true, job: {...updated job} }
```

**Location for creation**:
- Directory: `/src/app/api/jobs/[id]/assign/`
- File: `route.ts`

---

### Step 2: Add "Accept" Button to Manager/Admin Order Pages
**Files to modify**:
1. `/src/app/manager/orders/[id]/page.tsx` - Add at top action buttons
2. `/src/app/admin/jobs/[id]/page.tsx` - Add at top action buttons

**Logic**:
```tsx
{order.status === 'pending' && (
  <Button
    onClick={handleAcceptOrder}
    className="bg-green-600 hover:bg-green-700"
    disabled={accepting}
  >
    {accepting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
    {accepting ? 'Accepting...' : 'Accept Order'}
  </Button>
)}
```

**Handler function**:
```tsx
const handleAcceptOrder = async () => {
  setAccepting(true);
  try {
    const response = await fetch(`/api/jobs/${jobId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        managerId: user?.id
      })
    });
    
    if (response.ok) {
      toast.success('Order accepted! Ready for freelancer assignment.');
      await fetchJob(); // Refresh
    } else {
      toast.error('Failed to accept order');
    }
  } catch (error) {
    toast.error('Error accepting order');
  } finally {
    setAccepting(false);
  }
};
```

---

### Step 3: Add "Assign Freelancer" Button + Dialog
**Files to modify**:
1. `/src/app/manager/orders/[id]/page.tsx` - Add assignment UI
2. `/src/app/admin/jobs/[id]/page.tsx` - Add assignment UI

**Logic**:
```tsx
{order.status === 'accepted' && (
  <Button
    onClick={() => setShowAssignDialog(true)}
    className="bg-blue-600 hover:bg-blue-700"
  >
    <UserPlus className="w-4 h-4 mr-2" />
    Assign Freelancer
  </Button>
)}

// Dialog with freelancer list dropdown
<Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Assign Freelancer</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>Select Freelancer</Label>
        <Select value={selectedFreelancerId} onValueChange={setSelectedFreelancerId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose freelancer..." />
          </SelectTrigger>
          <SelectContent>
            {freelancers.map(f => (
              <SelectItem key={f.id} value={String(f.id)}>
                {f.name} (Rating: {f.rating || 'N/A'} ⭐)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <DialogFooter>
      <Button onClick={handleAssignFreelancer} disabled={!selectedFreelancerId || assigning}>
        {assigning ? 'Assigning...' : 'Assign'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Handler**:
```tsx
const handleAssignFreelancer = async () => {
  if (!selectedFreelancerId) return;
  
  setAssigning(true);
  try {
    const response = await fetch(`/api/jobs/${jobId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freelancerId: parseInt(selectedFreelancerId),
        managerId: user?.id
      })
    });
    
    if (response.ok) {
      toast.success('Freelancer assigned successfully!');
      setShowAssignDialog(false);
      await fetchJob();
    } else {
      toast.error('Failed to assign freelancer');
    }
  } catch (error) {
    toast.error('Error assigning freelancer');
  } finally {
    setAssigning(false);
  }
};
```

---

### Step 4: Verify Freelancer Order Pages Have Upload Buttons
**File to check**: `/src/app/freelancer/orders/[id]/page.tsx`

**Required buttons for "assigned" or "in_progress" status**:
- 📤 Upload Draft
- 📤 Upload Final
- 📝 Upload Reports (info message)
- ✅ Submit Files

If missing, add similar upload UI to what exists in `/src/app/client/jobs/[id]/page.tsx`

---

### Step 5: Add Submit Endpoint for Freelancer
**File to create**: `src/app/api/jobs/[id]/submit/route.ts`

```typescript
// POST /api/jobs/[id]/submit
// Request: { freelancerId: number, submissionType: "final" }
// Updates: status = "editing", finalSubmissionComplete = true
// Notifies: Client, Admin, Manager
// Response: { success: true, job: {...} }
```

---

### Step 6: Add Request Revision Endpoint (for Client)
**File to create**: `src/app/api/jobs/[id]/request-revision/route.ts`

```typescript
// POST /api/jobs/[id]/request-revision
// Request: { clientId: number, revisionNotes: string }
// Updates: status = "revision", revisionRequested = true, revisionNotes = text
// Notifies: Freelancer (direct notification), Admin, Manager
// Response: { success: true, job: {...} }
```

---

## 🎯 PRIORITY ORDER

1. **FIRST**: Create `/api/jobs/[id]/assign/route.ts`
2. **SECOND**: Add Accept & Assign buttons to manager/admin pages
3. **THIRD**: Verify freelancer upload UI exists
4. **FOURTH**: Create `/api/jobs/[id]/submit/route.ts`
5. **FIFTH**: Create `/api/jobs/[id]/request-revision/route.ts`

---

## 📋 TESTING CHECKLIST

After each endpoint/button is created:

- [ ] Manager can see and click "Accept" on pending orders
- [ ] After accepting, order status changes to "accepted"
- [ ] Manager sees "Assign Freelancer" button on accepted orders
- [ ] Can select and assign freelancer successfully
- [ ] Freelancer receives notification of assignment
- [ ] Freelancer sees order in their "assigned" list
- [ ] Freelancer can upload draft, final, and reports
- [ ] After submission, order moves to "editing" status
- [ ] Client can request revision from editing stage
- [ ] All users notified of revision requests

---

## 💡 IMPORTANT NOTES

- User must be authenticated (Authorization header with Bearer token)
- Use `/api/` endpoints from frontend with proper error handling
- All status changes trigger notifications to affected users
- Maintain audit trail for admin/manager actions
- File uploads should track uploader role and type
- Notifications should be real-time where possible

