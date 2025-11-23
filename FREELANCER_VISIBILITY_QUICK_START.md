# Freelancer Visibility Features - Quick Setup Guide

## Database Setup

### 1. Apply Schema Changes
The new tables have been added to `src/db/schema.ts`. Run:

```bash
npm run db:push
# or
bun run db:push
```

This will create two new tables:
- `client_freelancer_history` - Tracks client-freelancer work history
- `freelancer_online_status` - Tracks real-time online/offline status

### 2. Verify Tables Created
Check your database to confirm tables exist:
- `client_freelancer_history`
- `freelancer_online_status`

---

## Integration Checklist

### Freelancer Status Updates (IMPORTANT)
Add status update calls in your freelancer login/logout flows:

#### On Login:
```typescript
// After successful login
await fetch('/api/v2/freelancers/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    freelancerId: user.id,
    isOnline: true,
  }),
});
```

#### On Logout:
```typescript
// Before clearing session
await fetch('/api/v2/freelancers/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    freelancerId: user.id,
    isOnline: false,
  }),
});
```

### Job Completion Integration
When a job is marked complete with payment confirmed, call:

```typescript
// Call after job completion API
await fetch('/api/v2/freelancers/history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobId: completedJobId }),
});
```

### Job API Response
Update your job API to include freelancer details when responding. The frontend expects:

```typescript
{
  // ... existing fields
  assignedFreelancerId: number | null,
  assignedFreelancerName: string, // New
  assignedFreelancerEmail: string, // New
  assignedFreelancerRating: number | null, // New
}
```

---

## Features Deployed

### ✅ For Clients

#### 1. Freelancer Preference on New Order
- Navigate to: **Client > New Job**
- See: "Freelancer Preference" card after printable sources
- Choose: Preferred freelancer from previous work or "Any Available"
- Data sent with order creation

#### 2. Active Writers Count
- Navigate to: **Client Dashboard**
- See: "Active Writers" widget (green card)
- Shows: Real-time count of online freelancers
- Updates: Every 30 seconds automatically

#### 3. Freelancer Info in Order Details
- Navigate to: **Client > Jobs > [Order ID]**
- See: "Assigned Freelancer" card (if order is assigned)
- Shows: Name, email, and star rating
- Visible: Once freelancer is assigned

### ✅ For Admin/Manager

#### 1. Live Writers Dashboard - Admin
- Navigate to: **Admin > Live Writers**
- See: Real-time dashboard of all active freelancers
- Features:
  - Filter: Online only or all writers
  - Search: By name or email
  - Stats: Active count, total jobs, avg jobs per writer
  - Cards: Show status, jobs, last seen, rating

#### 2. Live Writers Dashboard - Manager
- Navigate to: **Manager > Live Writers**
- Same features as admin version
- Purple theme (vs blue for admin)
- Title: "Freelancers on Duty"

---

## API Endpoints Available

### 1. GET `/api/v2/freelancers/previous`
Get previous freelancers for a client:
```bash
GET /api/v2/freelancers/previous?clientId=123&limit=10
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "freelancers": [
    {
      "freelancerId": 456,
      "freelancerName": "John Doe",
      "freelancerEmail": "john@example.com",
      "freelancerRating": 4.8,
      "completedJobs": 5,
      "avgRating": 4.7,
      "lastWorkedAt": "2025-11-23T10:30:00Z"
    }
  ]
}
```

### 2. GET `/api/v2/freelancers/active`
Get currently active freelancers:
```bash
GET /api/v2/freelancers/active
```

**Response:**
```json
{
  "success": true,
  "activeCount": 12,
  "freelancers": [
    {
      "freelancerId": 456,
      "freelancerName": "John Doe",
      "currentJobsCount": 2,
      "isOnline": true,
      "lastSeenAt": "2025-11-23T10:45:00Z"
    }
  ]
}
```

### 3. POST `/api/v2/freelancers/status`
Update freelancer online status:
```bash
POST /api/v2/freelancers/status
Content-Type: application/json

{
  "freelancerId": 456,
  "isOnline": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Marked as online",
  "activeJobsCount": 2
}
```

### 4. POST `/api/v2/freelancers/history`
Update freelancer work history:
```bash
POST /api/v2/freelancers/history
Content-Type: application/json

{
  "jobId": 789
}
```

**Response:**
```json
{
  "success": true,
  "message": "Freelancer history updated"
}
```

---

## Files Modified

### New Components
- `src/components/FreelancerPreference.tsx` - Freelancer selection UI
- `src/components/ActiveWritersCount.tsx` - Active writers widget

### New API Routes
- `src/app/api/v2/freelancers/previous/route.ts`
- `src/app/api/v2/freelancers/active/route.ts`
- `src/app/api/v2/freelancers/status/route.ts`
- `src/app/api/v2/freelancers/history/route.ts`

### New Pages
- `src/app/admin/live-writers/page.tsx`
- `src/app/manager/live-writers/page.tsx`

### Modified Files
- `src/db/schema.ts` - Added 2 new tables
- `src/app/client/dashboard/page.tsx` - Added ActiveWritersCount
- `src/app/client/new-job/page.tsx` - Added FreelancerPreference
- `src/app/client/jobs/[id]/page.tsx` - Added freelancer info display

---

## Testing

### Quick Test Steps

1. **Create New Order**
   - Go to Client > New Job
   - Verify FreelancerPreference component shows
   - If client has previous orders, freelancers should list
   - Complete and submit order

2. **View Active Writers**
   - Go to Client Dashboard
   - Verify ActiveWritersCount widget displays
   - Should show count (may be 0 if no freelancers online)

3. **Check Live Writers** (Admin/Manager only)
   - Go to Admin > Live Writers (or Manager > Live Writers)
   - Should load dashboard
   - Search and filter should work

4. **View Order Details**
   - Go to Client > Jobs > [any completed order]
   - Scroll to "Assigned Freelancer" section
   - Should show freelancer name if assigned
   - Should show rating if available

---

## Troubleshooting

### Database Tables Not Created
```bash
# Force database migration
npm run db:push -- --force
# or
bun run db:push --force
```

### ActiveWritersCount Shows 0
- Verify freelancer status updates are being called on login
- Check browser console for API errors
- Check freelancer_online_status table in database

### Freelancer Name Not Showing in Order
- Ensure job API returns freelancer fields (assignedFreelancerName, etc.)
- Verify freelancer is actually assigned to job
- Check network tab for API response

### API Returns 400/500 Errors
- Check required parameters in API calls
- Verify IDs are valid
- Check database connectivity

---

## Performance Notes

- **ActiveWritersCount**: Refreshes every 30 seconds (configurable)
- **Live Writers Dashboard**: Refreshes every 10 seconds
- **API Endpoints**: All return cached data (no heavy calculations)
- **Database Indexes**: Unique indexes on (clientId, freelancerId) and freelancerId

---

## Next Phase: Enhancements

Potential improvements:
1. Email notifications to preferred freelancers about new orders
2. Freelancer scheduling/availability calendar
3. Performance metrics dashboard for top freelancers
4. Automatic matching based on rating/skills
5. Pricing tiers for preferred freelancer requests
6. Integration with payment system for faster assignment

---

**Status**: ✅ Ready for Deployment

All features are implemented and tested. Follow the integration checklist to fully activate the system.
