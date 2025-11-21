# Missing Tables & Fields Diagram

## 🔴 CRITICAL MISSING TABLES

### 1. `invitations` Table (CRITICAL for manager registration)
```
┌─────────────────────────────────┐
│        invitations              │
├─────────────────────────────────┤
│ id (PK)                    INT  │
│ email                      TEXT │ (UNIQUE, NOT NULL)
│ role                       TEXT │ (NOT NULL: 'manager','client','writer')
│ token                      TEXT │ (UNIQUE, NOT NULL)
│ status                     TEXT │ (DEFAULT 'pending': pending/used/expired)
│ used                       INT  │ (BOOLEAN, DEFAULT 0)
│ expires_at                 TEXT │ (NOT NULL, DATETIME)
│ created_by_admin_id        INT  │ (FK → users.id, nullable)
│ created_at                 TEXT │ (DEFAULT CURRENT_TIMESTAMP)
└─────────────────────────────────┘
        ↓ References
    ┌───────────┐
    │ users.id  │
    └───────────┘
```

**Why critical:** API endpoint `POST /api/invitations/register` expects this exact table to validate invitation tokens. Current repo only has `manager_invitations` (which lacks `role` and `status` columns).

---

### 2. `writer_balances` Table (Missing—affects freelancer payouts)
```
┌──────────────────────────────────────┐
│       writer_balances                │
├──────────────────────────────────────┤
│ id (PK)                        INT   │
│ writer_id (FK → users.id)      INT   │ (NOT NULL, UNIQUE)
│ available_balance              REAL  │ (DEFAULT 0)
│ pending_balance                REAL  │ (DEFAULT 0)
│ total_earned                   REAL  │ (DEFAULT 0)
│ updated_at                     TEXT  │ (DEFAULT CURRENT_TIMESTAMP)
└──────────────────────────────────────┘
        ↓ References
    ┌───────────┐
    │ users.id  │
    └───────────┘
```

**Purpose:** Tracks freelancer (writer) balance separate from general user balance. Used for payouts after order completion and payment confirmation.

---

### 3. `order_history` Table (Missing—audit trail)
```
┌──────────────────────────────────────────┐
│       order_history                      │
├──────────────────────────────────────────┤
│ id (PK)                          INT     │
│ job_id (FK → jobs.id)            INT     │ (NOT NULL)
│ action                           TEXT    │ (NOT NULL: 'Order accepted', 'Assigned', etc.)
│ old_status                       TEXT    │ (nullable)
│ new_status                       TEXT    │ (nullable)
│ actor_id (FK → users.id)         INT     │ (nullable—who triggered action)
│ notes                            TEXT    │ (nullable)
│ created_at                       TEXT    │ (DEFAULT CURRENT_TIMESTAMP)
└──────────────────────────────────────────┘
        ↓ References
    ┌──────────────┐
    │ jobs.id      │  + users.id
    └──────────────┘
```

**Purpose:** Logs every status change and action. Currently you have `job_status_logs` which is similar but may lack action descriptions. Recommend merging or aliasing.

---

## 🟡 CRITICAL MISSING FIELDS

### 4. `jobs` Table - Missing `manager_id` Column
```
Current jobs table:
┌──────────────────────────────────────────────┐
│           jobs (current)                     │
├──────────────────────────────────────────────┤
│ ... existing fields (id, clientId, etc.) ... │
│ assignedFreelancerId (FK → users.id)         │ ← Writer assignment
│ [MISSING] manager_id (FK → users.id)   ← ADD THIS
│ status (pending, accepted, assigned, etc.)  │
│ createdAt, updatedAt                        │
└──────────────────────────────────────────────┘
```

**Add:**
```sql
ALTER TABLE jobs ADD COLUMN manager_id INTEGER REFERENCES users(id);
```

**Purpose:** Links each job/order to the manager who accepted/assigned it. Critical for:
- Manager dashboard (show only their jobs)
- Manager earnings (calculate per-manager payouts)
- Client-manager assignment tracking

---

### 5. `users` Table - Verify `manager_id` Alias
```
Current users table has:
┌─────────────────────────────────────────┐
│         users (current)                 │
├─────────────────────────────────────────┤
│ ... existing fields ...                 │
│ assignedManagerId (FK → users.id)  ← EXISTING
│ [VERIFY] Should reference manager      │
└─────────────────────────────────────────┘
```

**Issue:** Your schema uses `assigned_manager_id` but some API code may expect `manager_id`. 

**Fix:** Either:
- Add alias in schema: `managerIdAlias: integer('manager_id').references(() => users.id)`
- Or update all API code to use `assigned_manager_id`

---

### 6. `manager_invitations` Table - Missing `role` & `status`
```
Current manager_invitations:
┌───────────────────────────────────────┐
│    manager_invitations (current)      │
├───────────────────────────────────────┤
│ id (PK)                        INT    │
│ email                          TEXT   │
│ token                          TEXT   │
│ createdBy (FK → users.id)      INT    │
│ [MISSING] role            TEXT ← ADD
│ [MISSING] status          TEXT ← ADD
│ used (INT BOOLEAN)             INT    │
│ usedAt, expiresAt, createdAt  TEXT    │
└───────────────────────────────────────┘
```

**Add:**
```sql
ALTER TABLE manager_invitations ADD COLUMN role TEXT DEFAULT 'manager';
ALTER TABLE manager_invitations ADD COLUMN status TEXT DEFAULT 'pending';
```

**Alternative:** Delete `manager_invitations`, rename/use generic `invitations` table instead (recommended for scalability).

---

## 🟢 EXISTING TABLES (Verified Present)

### ✅ `managers` (Present, but may need tweaks)
```
┌──────────────────────────────────────────┐
│          managers (✓ Present)            │
├──────────────────────────────────────────┤
│ id (PK)                          INT     │
│ user_id (FK → users.id)          INT     │ (UNIQUE)
│ phone                            TEXT    │
│ balance                          REAL    │ (DEFAULT 0)
│ totalEarnings                    REAL    │ (DEFAULT 0)
│ status (active/inactive)         TEXT    │ (DEFAULT 'active')
│ [OPTIONAL] assigned_clients_count INT    │ (denormalized from client_manager)
│ createdAt, updatedAt             TEXT    │
└──────────────────────────────────────────┘
        ↓ References
    ┌───────────┐
    │ users.id  │
    └───────────┘
```

---

### ✅ `client_manager` (Present)
```
┌──────────────────────────────────────────┐
│      client_manager (✓ Present)          │
├──────────────────────────────────────────┤
│ id (PK)                          INT     │
│ client_id (FK → users.id)        INT     │ (NOT NULL)
│ manager_id (FK → users.id)       INT     │ (NOT NULL)
│ assigned_at                      TEXT    │ (DEFAULT CURRENT_TIMESTAMP)
│ createdAt                        TEXT    │
└──────────────────────────────────────────┘
        ↓ References
    ┌───────────────┐
    │ users.id (x2) │
    └───────────────┘
```

---

### ✅ `manager_earnings` (Present)
```
┌──────────────────────────────────────────┐
│     manager_earnings (✓ Present)         │
├──────────────────────────────────────────┤
│ id (PK)                          INT     │
│ manager_id (FK → users.id)       INT     │ (NOT NULL)
│ job_id (FK → jobs.id)            INT     │ (NOT NULL)
│ earning_type                     TEXT    │ ('assign'=10, 'submit'=10+5*pages)
│ amount                           REAL    │ (NOT NULL)
│ createdAt                        TEXT    │
└──────────────────────────────────────────┘
        ↓ References
    ┌───────────────┐
    │ users.id      │
    │ jobs.id       │
    └───────────────┘
```

---

## 📊 Complete Relationship Diagram

```
                    ┌─────────────────┐
                    │     users       │
                    │   (base table)  │
                    │ • role (text)   │
                    │ • assigned_      │
                    │   manager_id    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
   │  managers   │  │    jobs      │  │   writers    │
   │  (✓)        │  │   (order)    │  │   (user)     │
   │ • user_id   │  │ • client_id  │  │ • profile    │
   │ • balance   │  │ • freelancer │  │ • balance    │
   │             │  │ • manager_id │  │              │
   └─────┬───────┘  │ • status ──┐ │  └──────────────┘
         │          └────┬───────┘ │
         │               │        │
         ▼               ▼        ▼
    ┌──────────────┐ ┌────────────────────┐ ┌─────────────────┐
    │ client_      │ │  invitations       │ │ writer_balances │
    │ manager      │ │  (CRITICAL MISSING)│ │ (MISSING)       │
    │ (✓)          │ │ • email            │ │ • writer_id     │
    │ • client_id  │ │ • role             │ │ • available_bal │
    │ • manager_id │ │ • token            │ │ • pending_bal   │
    │              │ │ • status           │ │                 │
    └──────────────┘ │ • expires_at       │ └─────────────────┘
                     └────────────────────┘
         
         ▼
    ┌──────────────────┐
    │ manager_earnings │ (✓)
    │ • manager_id     │
    │ • job_id         │
    │ • earning_type   │
    │ • amount         │
    └──────────────────┘
         
         ▼
    ┌──────────────────────┐
    │  order_history       │ (MISSING—use job_status_logs as fallback)
    │  (audit trail)       │
    │ • job_id             │
    │ • action             │
    │ • old_status         │
    │ • new_status         │
    │ • actor_id           │
    └──────────────────────┘
```

---

## 🔧 Summary of Changes Needed

| # | Table/Field | Status | Priority | Action |
|---|---|---|---|---|
| 1 | `invitations` | Missing | 🔴 CRITICAL | Create table with (id, email, role, token, status, used, expires_at, created_by_admin_id, created_at) |
| 2 | `jobs.manager_id` | Missing | 🔴 CRITICAL | Add FK column to jobs table |
| 3 | `writer_balances` | Missing | 🟡 HIGH | Create table for writer-specific balance tracking |
| 4 | `order_history` / `job_status_logs` | Partial | 🟡 HIGH | Verify `job_status_logs` covers all use cases or create `order_history` |
| 5 | `manager_invitations.role` | Missing | 🟡 HIGH | Add column (or deprecate in favor of `invitations` table) |
| 6 | `manager_invitations.status` | Missing | 🟡 HIGH | Add column (or deprecate in favor of `invitations` table) |
| 7 | `users.manager_id` alias | Verify | 🟢 LOW | Check if `assigned_manager_id` is the right field or add alias |
| 8 | `managers.assigned_clients_count` | Optional | 🟢 LOW | Add denormalized field (optional, can compute from client_manager) |

---

## 📝 SQL Migration Commands

### Create `invitations` Table (SQLite/Turso)
```sql
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('manager', 'client', 'writer')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'used', 'expired')),
  used INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_by_admin_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
```

### Add `manager_id` to `jobs`
```sql
ALTER TABLE jobs ADD COLUMN manager_id INTEGER REFERENCES users(id);
CREATE INDEX idx_jobs_manager_id ON jobs(manager_id);
```

### Create `writer_balances` Table
```sql
CREATE TABLE IF NOT EXISTS writer_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  writer_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  available_balance REAL NOT NULL DEFAULT 0,
  pending_balance REAL NOT NULL DEFAULT 0,
  total_earned REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_writer_balances_writer_id ON writer_balances(writer_id);
```

### Add Columns to `manager_invitations`
```sql
ALTER TABLE manager_invitations ADD COLUMN role TEXT DEFAULT 'manager';
ALTER TABLE manager_invitations ADD COLUMN status TEXT DEFAULT 'pending';
```

### Create `order_history` Audit Table (Optional—if not using `job_status_logs`)
```sql
CREATE TABLE IF NOT EXISTS order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  actor_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_history_job_id ON order_history(job_id);
```

---

## 🚀 How to Deploy These Changes

### Option 1: Using Drizzle Kit (Recommended)
```powershell
# 1. Update src/db/schema.ts with new table definitions (see below)
# 2. Generate migration
npx drizzle-kit generate

# 3. Review migration in drizzle/migrations/
# 4. Push to Turso
npx drizzle-kit push
```

### Option 2: Manual SQL via DB Client
1. Connect to your Turso database
2. Run the SQL commands above
3. Run introspection to sync schema: `npx drizzle-kit introspect`

### Option 3: Using `db-migrate.bat` (Included Script)
```powershell
.\db-migrate.bat full
```
