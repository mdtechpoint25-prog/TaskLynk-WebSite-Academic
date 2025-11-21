// ============================================================================
// MISSING TABLES FOR MANAGER REGISTRATION & ORDER LIFECYCLE
// ============================================================================
// Add these table definitions to the end of src/db/schema.ts
// Then run: npx drizzle-kit generate && npx drizzle-kit push
// ============================================================================

import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// ============================================================================
// 🔴 CRITICAL: invitations Table (Missing)
// ============================================================================
// Used by: POST /api/invitations/register
// Purpose: Validate invitation tokens for new user registration (manager, client, writer)
// Why it's missing: API expects this exact table; only manager_invitations exists
export const invitations = sqliteTable('invitations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // 'manager', 'client', 'writer', 'admin'
  token: text('token').notNull().unique(),
  status: text('status').notNull().default('pending'), // 'pending', 'used', 'expired'
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  expiresAt: text('expires_at').notNull(),
  createdByAdminId: integer('created_by_admin_id').references(() => users.id),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

// ============================================================================
// 🟡 HIGH: writer_balances Table (Missing)
// ============================================================================
// Used by: Freelancer/Writer payout system
// Purpose: Track per-writer balance separate from general users.balance
// Replaces: Direct updates to users.balance for writers
export const writerBalances = sqliteTable('writer_balances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  writerId: integer('writer_id').notNull().unique().references(() => users.id),
  availableBalance: real('available_balance').notNull().default(0),
  pendingBalance: real('pending_balance').notNull().default(0),
  totalEarned: real('total_earned').notNull().default(0),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
});

// ============================================================================
// 🟡 HIGH: order_history Table (Missing—Audit Trail)
// ============================================================================
// Used by: Order status audit, compliance logging, debugging
// Purpose: Immutable log of all order state changes and actions
// Alternative: Merge with existing job_status_logs if semantics match
export const orderHistory = sqliteTable('order_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  action: text('action').notNull(), // 'Order accepted', 'Writer assigned', 'Delivered', etc.
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  actorId: integer('actor_id').references(() => users.id), // Who made the change
  notes: text('notes'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

// ============================================================================
// 🔴 CRITICAL: MISSING FIELD on jobs Table
// ============================================================================
// Add to existing jobs table definition:
// managerId: integer('manager_id').references(() => users.id),
// This is needed because:
//   - Manager acceptance flow assigns manager to job
//   - Manager earnings calculated per job
//   - Manager dashboard filters by manager_id
// SQL: ALTER TABLE jobs ADD COLUMN manager_id INTEGER REFERENCES users(id);

// ============================================================================
// 🟡 HIGH: MISSING FIELDS on manager_invitations Table
// ============================================================================
// Add to existing manager_invitations table definition:
// role: text('role').default('manager'),
// status: text('status').default('pending'),
// SQL:
//   ALTER TABLE manager_invitations ADD COLUMN role TEXT DEFAULT 'manager';
//   ALTER TABLE manager_invitations ADD COLUMN status TEXT DEFAULT 'pending';

// ============================================================================
// REFERENCE: Existing tables (already present, for context)
// ============================================================================
// users (present)
//   - role: text (includes 'manager')
//   - assigned_manager_id: FK to users.id ✓
//
// managers (present)
//   - user_id: FK to users.id ✓
//   - balance, totalEarnings, status ✓
//   - [OPTIONAL] assigned_clients_count: not present (can compute from client_manager)
//
// client_manager (present)
//   - client_id, manager_id, assigned_at ✓
//
// manager_earnings (present)
//   - manager_id, job_id, earning_type, amount ✓
//
// jobs (present, but needs manager_id added)
//   - clientId, assignedFreelancerId, status, etc. ✓
//   - [MISSING] manager_id ✗
//
// job_status_logs (present)
//   - Similar to order_history; verify if it covers all needed audit fields

// ============================================================================
// DRIZZLE SCHEMA EXPORT SUMMARY
// ============================================================================
// After adding the above tables to src/db/schema.ts, the complete export should be:
//
// export { 
//   accounts, domains, users, userStats, jobs, bids, payments,
//   notifications, jobMessages, ratings, jobAttachments, invoices,
//   messages, revisions, emailLogs, jobFiles, emailVerificationCodes,
//   pendingRegistrations, passwordResetTokens, paymentRequests,
//   emailNotifications, managerInvitations, jobStatusLogs, managers,
//   clientManager, managerEarnings, userCategories, systemLogs,
//   // NEW TABLES:
//   invitations, writerBalances, orderHistory
// };

// ============================================================================
// IMPLEMENTATION GUIDE
// ============================================================================
// 
// 1. Open src/db/schema.ts
// 
// 2. Add these three table definitions at the end (before the export statement):
//
//    export const invitations = sqliteTable('invitations', { ... });
//    export const writerBalances = sqliteTable('writer_balances', { ... });
//    export const orderHistory = sqliteTable('order_history', { ... });
//
// 3. Update the jobs table definition to include:
//    managerId: integer('manager_id').references(() => users.id),
//
// 4. Update the manager_invitations table definition to include:
//    role: text('role').default('manager'),
//    status: text('status').default('pending'),
//
// 5. Add the new tables to the export statement at the bottom:
//    export { 
//      // ... existing tables ...
//      invitations, 
//      writerBalances, 
//      orderHistory 
//    };
//
// 6. Generate and push migrations:
//    npx drizzle-kit generate
//    npx drizzle-kit push
//
// 7. Verify the changes in your database
//
// ============================================================================
