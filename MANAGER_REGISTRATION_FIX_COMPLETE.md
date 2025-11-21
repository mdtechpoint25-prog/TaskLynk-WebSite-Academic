# Manager Registration System - Fixed ✅

## Summary
Successfully fixed the manager registration system by resolving database schema drift issues and properly handling the database constraints.

## Issues Fixed

### 1. **Missing Database Tables**
- ✅ Created `managers` table
- ✅ Created `client_manager` table (for linking clients to managers)
- ✅ Created `manager_earnings` table (for tracking manager earnings)

### 2. **Schema Drift - Missing Columns in users Table**
The actual Turso database was missing several columns that the Drizzle schema expected:
- ✅ Added `balance` column
- ✅ Added `suspended_until` column
- ✅ Added `suspension_reason` column
- ✅ Added `blacklist_reason` column
- ✅ Added `rejected_at` column
- ✅ Added `rejection_reason` column
- ✅ Added `total_spent` column
- ✅ Added `completed_jobs` column
- ✅ Added `completion_rate` column
- ✅ Added `updated_at` column

### 3. **role_id Constraint**
- **Problem**: Database has both `role` (text) and `role_id` (integer, NOT NULL) columns
- **Solution**: Updated registration API to use raw SQL that includes `role_id=3` (manager role ID)
- The registration now falls back to raw SQL when Drizzle insert fails due to role_id constraint

### 4. **Status Enum Constraint**
- **Problem**: Database has CHECK constraint: `status IN ('pending', 'approved', 'rejected', 'suspended', 'blacklisted')`
- **Solution**: Changed manager status from 'active' to 'approved' during registration

## Database Structure

### Roles Table
```
1 = admin
2 = client  
3 = manager
4 = writer (freelancer)
```

### Managers Table Structure
```sql
CREATE TABLE managers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  assigned_clients TEXT DEFAULT '[]',
  performance_rating REAL DEFAULT 0,
  total_orders_assigned INTEGER DEFAULT 0,
  total_orders_submitted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Client_Manager Table
```sql
CREATE TABLE client_manager (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  manager_id INTEGER NOT NULL,
  assigned_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
)
```

### Manager_Earnings Table
```sql
CREATE TABLE manager_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  earning_type TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (manager_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
)
```

## Registration Flow

### 1. Invitation Creation (Admin)
Admin creates invitation via `/api/admin/invite-manager`:
- Generates unique token
- Stores in `manager_invitations` table
- Sends invitation email with registration link

### 2. Manager Registration (`/api/invitations/register`)
When manager clicks the invitation link:
1. Verify invitation token is valid and not used
2. Check email doesn't already exist
3. Generate unique display ID (MNG#####)
4. Hash password
5. **Insert user with raw SQL** (includes role_id=3):
   ```sql
   INSERT INTO users (
     display_id, email, password, name, role, role_id, phone,
     approved, email_verified, status, created_at, updated_at
   ) VALUES (
     ?, ?, ?, ?, 'manager', 3, ?, 1, 1, 'approved', ?, ?
   )
   ```
6. Mark invitation as used
7. Return success message

### 3. Auto-Approval
Managers are automatically approved upon registration:
- `approved = 1` (true)
- `email_verified = 1` (true)
- `status = 'approved'`

## API Endpoints

### Manager Invitation
**POST** `/api/admin/invite-manager`
```json
{
  "email": "manager@example.com"
}
```

### Manager Registration
**POST** `/api/invitations/register`
```json
{
  "token": "invitation-token-here",
  "password": "secure-password",
  "fullName": "John Doe",
  "phoneNumber": "+254700000000"
}
```

### Verify Invitation
**GET** `/api/invitations/verify?token=invitation-token`

## Files Modified

1. **src/db/schema.ts**
   - Added `managers`, `clientManager`, and `managerEarnings` table definitions

2. **src/app/api/invitations/register/route.ts**
   - Added fallback to raw SQL insert when role_id constraint fails
   - Changed status from 'active' to 'approved'
   - Added proper error handling and retry logic

3. **src/scripts/add-manager-tables.ts** (New)
   - Script to create manager-related tables

4. **src/scripts/fix-users-table-schema.ts** (New)
   - Script to add missing columns to users table

5. **src/scripts/test-manager-registration.ts** (New)
   - Comprehensive test script for manager registration flow

## Testing

Run the test script to verify manager registration:
```bash
bun run src/scripts/test-manager-registration.ts
```

Test output:
```
✅ MANAGER REGISTRATION TEST PASSED!
- User created with role=manager
- User auto-approved and email verified
- Invitation marked as used
- All database constraints satisfied
```

## Manager Access

After registration, managers can:
1. Log in at `/login` with their email and password
2. Access manager dashboard at `/manager/dashboard`
3. View assigned clients at `/manager/clients`
4. Manage orders at `/manager/orders`
5. Track earnings and performance

## Database Connection

The system uses Turso (LibSQL) as the database:
- **Host**: Configured in `.env` as `TURSO_DATABASE_URL`
- **Auth Token**: Configured in `.env` as `TURSO_AUTH_TOKEN`
- **ORM**: Drizzle ORM for type-safe database operations

## Next Steps

The manager registration system is now fully functional. Users can now register as managers through invitation links and access all manager features.

---

**Status**: ✅ COMPLETE
**Last Updated**: 2025-11-17
**Tested**: Yes - All tests passing
