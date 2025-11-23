# CPP Level System - Quick Reference & Setup Guide

## 🚀 Quick Start

### 1. Database Initialization (One-Time)

**Seed CPP Level Definitions**:
```bash
curl -X POST http://localhost:3000/api/v2/admin/cpp-levels/seed
```

**Response**:
```json
{
  "success": true,
  "message": "CPP Levels seeded successfully",
  "count": 5
}
```

### 2. Initialize Freelancer CPP Progress

**For New Freelancer on Approval**:
```typescript
await fetch('/api/v2/freelancers/cpp/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    freelancerId: 123,
    isWorkTypeSpecialized: false
  })
});
```

**For Existing Freelancers** (Migration):
```typescript
import { initializeCPPProgressForAllFreelancers } from '@/lib/migrate-cpp-progress';
await initializeCPPProgressForAllFreelancers();
```

---

## 📊 CPP Tier Reference

### Starting Point
- **Level 1 - Starter**
  - Non-Technical: KSh 150
  - Technical: KSh 170 (+20)
  - Progress: 0/3 orders

### After 3 Orders
- **Level 2 - Rising**
  - Non-Technical: KSh 160
  - Technical: KSh 180 (+20)
  - Progress: 3/5 orders

### After 8 Orders (3 + 5)
- **Level 3 - Established**
  - Non-Technical: KSh 170
  - Technical: KSh 190 (+20)
  - Progress: 8/15 orders

### After 23 Orders (8 + 15)
- **Level 4 - Expert**
  - Non-Technical: KSh 180
  - Technical: KSh 200 (+20)
  - Progress: 23/27 orders

### After 50 Orders (23 + 27)
- **Level 5 - Master**
  - Non-Technical: KSh 200
  - Technical: KSh 220 (+20)
  - Progress: ∞ (Final Tier)

---

## 💻 Using CPP in Payment Calculations

### Old Way (Fixed Rates)
```typescript
import { calculateWriterEarnings } from '@/lib/payment-calculations';
const payout = calculateWriterEarnings(10, null, 'essay');
// Always returns: 10 × 200 = 2000
```

### New Way (CPP Levels)
```typescript
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';
const payout = calculateWriterEarningsByCPPLevel(
  10,                    // pages
  null,                  // slides
  'essay',              // work type
  user.completedJobs    // completed orders (determines level)
);
// Returns: 10 × 170 = 1700 (if at 8+ orders)
```

### Get Current Rate
```typescript
import { getFreelancerCPPRate } from '@/lib/payment-calculations';
const rate = getFreelancerCPPRate('essay', 25);
// Returns: 180 (Level 4 - Expert)

const rateWithBonus = getFreelancerCPPRate('data-analysis', 25);
// Returns: 200 (Level 4 + technical bonus)
```

---

## 🎨 UI Components

### Display Progress Widget
```tsx
import CPPProgressWidget from '@/components/CPPProgressWidget';

export default function Dashboard() {
  return (
    <div>
      <CPPProgressWidget freelancerId={user.id} />
    </div>
  );
}
```

### Show Approval Notification
```tsx
import CPPApprovalNotification from '@/components/CPPApprovalNotification';
import { getAllCPPLevels } from '@/lib/cpp-calculation';

export default function SettingsPage() {
  return (
    <div>
      <CPPApprovalNotification
        cppLevels={getAllCPPLevels()}
        isApproved={true}
      />
    </div>
  );
}
```

---

## 📡 API Endpoints

### Get CPP Status
```
GET /api/v2/freelancers/cpp?freelancerId=123

Response:
{
  "success": true,
  "freelancer": { "id": 123, "name": "John" },
  "cppStatus": {
    "currentLevel": 3,
    "totalCompletedOrders": 12,
    "ordersInCurrentLevel": 4,
    "progressPercentage": 26.7,
    "nextLevelOrdersRequired": 11,
    "currentCPP": 170,
    "nextLevelCPP": 180,
    "isWorkTypeSpecialized": false
  },
  "cppLevels": [...all 5 tiers...],
  "currentLevelDetails": {...tier 3...},
  "nextLevelDetails": {...tier 4...}
}
```

### Initialize CPP Progress
```
POST /api/v2/freelancers/cpp/initialize

Body:
{
  "freelancerId": 123,
  "isWorkTypeSpecialized": false
}

Response:
{
  "success": true,
  "message": "CPP progress initialized successfully",
  "cppProgress": {...}
}
```

### Get CPP Levels (Admin)
```
GET /api/v2/admin/cpp-levels

Response:
{
  "success": true,
  "levels": [...all 5 tier definitions...],
  "count": 5
}
```

### Seed CPP Levels (Admin)
```
POST /api/v2/admin/cpp-levels/seed

Response:
{
  "success": true,
  "message": "CPP Levels seeded successfully",
  "count": 5
}
```

---

## 🔧 Configuration

### Modify CPP Rates
Edit `src/lib/cpp-calculation.ts`:

```typescript
export const CPP_LEVELS: CPPLevel[] = [
  {
    level: 1,
    levelName: 'Starter',
    completedOrdersRequired: 0,
    cppNonTechnical: 150,  // ← Change here
    cppTechnical: 170,     // ← Change here
    orderCountInLevel: 3,  // ← Change milestone
    progressBarColor: '#10b981',
  },
  // ... more levels
];
```

### Add Technical Work Types
Edit `isWorkTypeTechnical()` function:

```typescript
const technicalTypes = [
  'data-analysis',
  'programming',
  'web-development',
  // Add more types here
];
```

---

## 📱 Where CPP is Used

1. **Freelancer Settings** - Shows all tiers and education
2. **Freelancer Earnings** - Displays real-time progress
3. **Order Detail Pages** - Shows rate for current tier
4. **Payment Calculations** - Determines freelancer payout
5. **Admin Dashboard** - Track freelancer progression
6. **Email Notifications** - Promotion messages (future)

---

## 🧪 Testing CPP System

### Check Tier Assignment
```typescript
import { calculateCPPProgress } from '@/lib/cpp-calculation';

// Test: 0 orders
const status1 = calculateCPPProgress(0, false);
console.assert(status1.currentLevel === 1);
console.assert(status1.currentCPP === 150);

// Test: 5 orders
const status2 = calculateCPPProgress(5, false);
console.assert(status2.currentLevel === 2);
console.assert(status2.currentCPP === 160);

// Test: 50 orders (Master)
const status3 = calculateCPPProgress(50, false);
console.assert(status3.currentLevel === 5);
console.assert(status3.currentCPP === 200);

// Test: Technical bonus
const status4 = calculateCPPProgress(5, true);
console.assert(status4.currentCPP === 180); // 160 + 20
```

### Check Payment Calculation
```typescript
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';

// Scenario: 10 pages, 0 slides, essay type, 5 completed orders
const payout = calculateWriterEarningsByCPPLevel(10, null, 'essay', 5);
console.log(payout); // Expected: 1600 (10 × 160 from Level 2)

// Scenario: Technical work
const techPayout = calculateWriterEarningsByCPPLevel(10, null, 'data-analysis', 5);
console.log(techPayout); // Expected: 1800 (10 × 180 from Level 2 + bonus)
```

---

## 🐛 Troubleshooting

### CPP Widget Not Loading
1. Check if freelancer ID is correct
2. Verify `freelancerCPPProgress` record exists
3. Check browser console for API errors
4. Ensure `CPP_LEVELS` table has 5 rows

### Wrong CPP Rate Being Applied
1. Verify `completedJobs` count on user record
2. Check `isWorkTypeSpecialized` value in `freelancerCPPProgress`
3. Confirm work type detection in `isWorkTypeTechnical()`
4. Check CPP level definitions in database

### Progress Not Updating
1. Verify order completion updates `users.completedJobs`
2. Check `freelancerCPPProgress.ordersInCurrentLevel` calculation
3. Ensure `lastProgressUpdate` timestamp is current
4. Test API endpoint directly: `/api/v2/freelancers/cpp?freelancerId=123`

---

## 📈 Monitoring

### Track Freelancer Distribution
```typescript
// Check how many freelancers at each level
const levels = await db
  .select({
    level: freelancerCPPProgress.currentLevel,
    count: count()
  })
  .from(freelancerCPPProgress)
  .groupBy(freelancerCPPProgress.currentLevel);
```

### Monitor Progression Rate
```typescript
// Average orders to reach Master tier
const masters = await db
  .select({ totalOrders: avg(freelancerCPPProgress.totalCompletedOrders) })
  .from(freelancerCPPProgress)
  .where(eq(freelancerCPPProgress.currentLevel, 5));
```

---

## 🎓 Learning Resources

- **CPP Calculation Logic**: `src/lib/cpp-calculation.ts`
- **Payment Integration**: `src/lib/payment-calculations.ts`
- **API Implementation**: `src/app/api/v2/freelancers/cpp/`
- **UI Components**: `src/components/CPP*.tsx`
- **Complete Documentation**: `CPP_LEVEL_SYSTEM_COMPLETE.md`
