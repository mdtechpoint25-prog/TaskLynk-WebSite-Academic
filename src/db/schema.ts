import { pgTable, serial, integer, text, varchar, boolean, numeric, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';


// NEW: Accounts table for account-linked clients
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  accountName: text('account_name').notNull().unique(),
  contactPerson: text('contact_person').notNull(),
  contactEmail: text('contact_email').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Domain Management
export const domains = pgTable('domains', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  maxUsers: integer('max_users'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🔴 CRITICAL: System Settings - Persistent admin configuration
export const systemSettings = pgTable('system_settings', {
  key: text('key').notNull().unique().primaryKey(),
  value: text('value').notNull(),
  type: text('type').notNull(), // 'string', 'number', 'boolean'
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// 🔴 CRITICAL: Invitations Table (for manager/client/writer registration)
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // 'manager', 'client', 'writer', 'admin'
  token: text('token').notNull().unique(),
  status: text('status').notNull().default('pending'), // 'pending', 'used', 'expired'
  used: boolean('used').notNull().default(false),
  expiresAt: text('expires_at').notNull(),
  createdByAdminId: integer('created_by_admin_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

// User Management
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  displayId: text('display_id').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // Values: 'admin', 'client', 'freelancer', 'manager', 'editor', 'account_owner'
  approved: boolean('approved').notNull().default(false),
  emailVerified: boolean('email_verified').notNull().default(false),
  balance: numeric('balance', { precision: 10, scale: 2 }).notNull().default('0'),
  earned: numeric('earned', { precision: 10, scale: 2 }).notNull().default('0'),
  totalEarnings: numeric('total_earnings', { precision: 10, scale: 2 }).notNull().default('0'),
  rating: numeric('rating', { precision: 10, scale: 2 }),
  // NEW aggregated rating fields
  ratingAverage: numeric('rating_average', { precision: 10, scale: 2 }).default('0'),
  ratingCount: integer('rating_count').default('0'),
  // NEW badges and presence
  badgeList: text('badge_list').notNull().default('[]'),
  presenceStatus: text('presence_status').notNull().default('offline'),
  phone: text('phone').notNull(),
  status: text('status').notNull().default('active'),
  suspendedUntil: text('suspended_until'),
  suspensionReason: text('suspension_reason'),
  blacklistReason: text('blacklist_reason'),
  rejectedAt: text('rejected_at'),
  rejectionReason: text('rejection_reason'),
  totalEarned: numeric('total_earned', { precision: 10, scale: 2 }).notNull().default('0'),
  totalSpent: numeric('total_spent', { precision: 10, scale: 2 }).notNull().default('0'),
  completedJobs: integer('completed_jobs').notNull().default('0'),
  completionRate: numeric('completion_rate', { precision: 10, scale: 2 }),
  profilePictureUrl: text('profile_picture_url'),
  lastLoginAt: text('last_login_at'),
  lastLoginIp: text('last_login_ip'),
  lastLoginDevice: text('last_login_device'),
  loginCount: integer('login_count').notNull().default('0'),
  domainId: integer('domain_id').references(() => domains.id, { onDelete: 'set null' }),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  accountName: text('account_name'),
  assignedManagerId: integer('assigned_manager_id').references(() => users.id, { onDelete: 'set null' }),
  freelancerBadge: text('freelancer_badge'),
  clientTier: text('client_tier').default('basic'),
  clientPriority: text('client_priority').notNull().default('regular'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  usersPhoneUnique: uniqueIndex('users_phone_unique').on(table.phone),
}));

// User Statistics
export const userStats = pgTable('user_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalJobsPosted: integer('total_jobs_posted').notNull().default('0'),
  totalJobsCompleted: integer('total_jobs_completed').notNull().default('0'),
  totalJobsCancelled: integer('total_jobs_cancelled').notNull().default('0'),
  totalAmountEarned: numeric('total_amount_earned', { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmountSpent: numeric('total_amount_spent', { precision: 10, scale: 2 }).notNull().default('0'),
  averageRating: numeric('average_rating', { precision: 10, scale: 2 }),
  totalRatings: integer('total_ratings').notNull().default('0'),
  onTimeDelivery: integer('on_time_delivery').notNull().default('0'),
  lateDelivery: integer('late_delivery').notNull().default('0'),
  revisionsRequested: integer('revisions_requested').notNull().default('0'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Jobs Management
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  displayId: text('display_id').notNull().unique(),
  orderNumber: text('order_number').notNull().unique(),
  orderId: text('order_id').notNull().unique(),
  accountOrderNumber: text('account_order_number'),
  accountLinked: boolean('account_linked').notNull().default(false),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedFreelancerId: integer('assigned_freelancer_id').references(() => users.id, { onDelete: 'set null' }),
  // 🔴 CRITICAL: Manager assignment field
  managerId: integer('manager_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  instructions: text('instructions').notNull(),
  workType: text('work_type').notNull(),
  pages: integer('pages'),
  slides: integer('slides'),
  problems: integer('problems'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  managerEarnings: numeric('manager_earnings', { precision: 10, scale: 2 }).notNull().default('0'),
  freelancerEarnings: numeric('freelancer_earnings', { precision: 10, scale: 2 }).notNull().default('0'),
  adminProfit: numeric('admin_profit', { precision: 10, scale: 2 }).notNull().default('0'),
  deadline: text('deadline').notNull(),
  actualDeadline: text('actual_deadline').notNull(),
  freelancerDeadline: text('freelancer_deadline').notNull(),
  requestDraft: boolean('request_draft').notNull().default(false),
  draftDelivered: boolean('draft_delivered').notNull().default(false),
  requestPrintableSources: boolean('request_printable_sources').notNull().default(false),
  singleSpaced: boolean('single_spaced').notNull().default(false),
  baseCpp: numeric('base_cpp', { precision: 10, scale: 2 }),
  effectiveCpp: numeric('effective_cpp', { precision: 10, scale: 2 }),
  status: text('status').notNull().default('pending'),
  // Manager approval gate (TIER 2 fix: Manager reviews before editor)
  managerApproved: boolean('manager_approved').notNull().default(false),
  managerApprovedAt: text('manager_approved_at'),
  managerApprovalNotes: text('manager_approval_notes'),
  // Editor approval gate (TIER 1 fix: Editor reviews work)
  assignedEditorId: integer('assigned_editor_id').references(() => users.id, { onDelete: 'set null' }),
  editorApproved: boolean('editor_approved').notNull().default(false),
  editorApprovedAt: text('editor_approved_at'),
  editorApprovalNotes: text('editor_approval_notes'),
  adminApproved: boolean('admin_approved').notNull().default(false),
  clientApproved: boolean('client_approved').notNull().default(false),
  approvedByClientAt: text('approved_by_client_at'),
  revisionRequested: boolean('revision_requested').notNull().default(false),
  revisionNotes: text('revision_notes'),
  paymentConfirmed: boolean('payment_confirmed').notNull().default(false),
  paidOrderConfirmedAt: text('paid_order_confirmed_at'),
  invoiceGenerated: boolean('invoice_generated').notNull().default(false),
  clientRating: integer('client_rating'),
  writerRating: integer('writer_rating'),
  reviewComment: text('review_comment'),
  placementPriority: integer('placement_priority').notNull().default('0'),
  urgencyMultiplier: numeric('urgency_multiplier', { precision: 10, scale: 2 }).notNull().default('1.0'),
  calculatedPrice: numeric('calculated_price', { precision: 10, scale: 2 }),
  isRealOrder: boolean('is_real_order').notNull().default(true),
  // ✅ NEW: Report/Submission flags for file workflow
  requiresReports: boolean('requires_reports').notNull().default(true),
  finalSubmissionComplete: boolean('final_submission_complete').notNull().default(false),
  revisionSubmissionComplete: boolean('revision_submission_complete').notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Bids
export const bids = pgTable('bids', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message'),
  bidAmount: numeric('bid_amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
});

// Payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').references(() => users.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull().default('mpesa'),
  status: text('status').notNull().default('pending'),
  mpesaCode: text('mpesa_code'),
  phoneNumber: text('phone_number'),
  mpesaCheckoutRequestId: text('mpesa_checkout_request_id'),
  mpesaMerchantRequestId: text('mpesa_merchant_request_id'),
  mpesaReceiptNumber: text('mpesa_receipt_number'),
  mpesaTransactionDate: text('mpesa_transaction_date'),
  mpesaResultDesc: text('mpesa_result_desc'),
  paystackReference: text('paystack_reference'),
  confirmedByAdmin: boolean('confirmed_by_admin').notNull().default(false),
  confirmedAt: text('confirmed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('is_read').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Job Messages
export const jobMessages = pgTable('job_messages', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  messageType: text('message_type').notNull().default('text'),
  adminApproved: boolean('admin_approved').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Ratings
export const ratings = pgTable('ratings', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  ratedUserId: integer('rated_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ratedByUserId: integer('rated_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  comment: text('comment'),
  // NEW: store rating dimensions and rater role
  metadata: text('metadata'),
  createdAt: text('created_at').notNull(),
});

// Job Attachments
export const jobAttachments = pgTable('job_attachments', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  uploadType: text('upload_type').notNull(),
  // NEW: Attachment category for organized file management
  attachmentCategory: text('attachment_category'),
  scheduledDeletionAt: text('scheduled_deletion_at'),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull(),
});

// Invoices
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').references(() => users.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  freelancerAmount: numeric('freelancer_amount', { precision: 10, scale: 2 }).notNull(),
  adminCommission: numeric('admin_commission', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('pending'),
  isPaid: boolean('is_paid').notNull().default(false),
  paidAt: text('paid_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  fileUrl: text('file_url'),
  adminApproved: boolean('admin_approved').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Revisions
export const revisions = pgTable('revisions', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  submittedBy: integer('submitted_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  revisionNotes: text('revision_notes'),
  status: text('status').notNull().default('pending_review'),
  sentToFreelancer: boolean('sent_to_freelancer').notNull().default(false),
  approvedByAdmin: boolean('approved_by_admin').notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Email Logs
export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  sentBy: integer('sent_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sentTo: text('sent_to').notNull(),
  recipientType: text('recipient_type').notNull(),
  recipientCount: integer('recipient_count').notNull(),
  fromEmail: text('from_email').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('sent'),
  failedRecipients: text('failed_recipients'),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
});

// Job Files
export const jobFiles = pgTable('job_files', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  uploadType: text('upload_type').notNull(),
  createdAt: text('created_at').notNull(),
});

// ✅ NEW: Order Files (versioned, typed uploads for orders)
export const orderFiles = pgTable('order_files', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  fileType: text('file_type').notNull(), // draft, final_document, plagiarism_report, ai_report, revision, additional, abstract, printable_sources, graphics_tables, completed_paper
  notes: text('notes'),
  versionNumber: integer('version_number').notNull().default(1),
  createdAt: text('created_at').notNull(),
});

// Email Verification Codes
export const emailVerificationCodes = pgTable('email_verification_codes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: text('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Pending Registrations - Store user data before email verification
export const pendingRegistrations = pgTable('pending_registrations', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  phone: text('phone').notNull(),
  accountName: text('account_name'),
  verificationCode: text('verification_code').notNull(),
  codeExpiresAt: text('code_expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: text('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Payment Requests - New table for client payment request system
export const paymentRequests = pgTable('payment_requests', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  phoneNumber: text('phone_number'),
  transactionReference: text('transaction_reference'),
  createdAt: text('created_at').notNull(),
  confirmedAt: text('confirmed_at'),
  confirmedBy: integer('confirmed_by').references(() => users.id, { onDelete: 'set null' }),
  rejectionReason: text('rejection_reason'),
});

// Email Notifications - New table for tracking automated email notifications
export const emailNotifications = pgTable('email_notifications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  notificationType: text('notification_type').notNull(),
  sentTo: text('sent_to').notNull(),
  sentAt: text('sent_at').notNull(),
  status: text('status').notNull().default('sent'),
  createdAt: text('created_at').notNull(),
});

// Add new manager_invitations table
export const managerInvitations = pgTable('manager_invitations', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  token: text('token').notNull().unique(),
  // 🟡 HIGH: Role and status fields for unified invitation system
  role: text('role').default('manager'),
  status: text('status').default('pending'), // 'pending', 'used', 'expired'
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull(),
  used: boolean('used').notNull().default(false),
  usedAt: text('used_at'),
  expiresAt: text('expires_at'),
});

// Job Status Logs - Audit trail for all status changes
export const jobStatusLogs = pgTable('job_status_logs', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  changedBy: integer('changed_by').references(() => users.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

// 🟡 HIGH: Order History - Comprehensive audit trail (extends job_status_logs)
export const orderHistory = pgTable('order_history', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'Order accepted', 'Writer assigned', 'Delivered', etc.
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }), // Who made the change
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 🟡 HIGH: Writer Balances - Track freelancer earnings separate from users.balance
export const writerBalances = pgTable('writer_balances', {
  id: serial('id').primaryKey(),
  writerId: integer('writer_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  availableBalance: numeric('available_balance', { precision: 10, scale: 2 }).notNull().default('0'),
  pendingBalance: numeric('pending_balance', { precision: 10, scale: 2 }).notNull().default('0'),
  totalEarned: numeric('total_earned', { precision: 10, scale: 2 }).notNull().default('0'),
  updatedAt: text('updated_at').notNull(),
});

// Manager Profile - Tracks manager-specific information
export const managers = pgTable('managers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  phone: text('phone'),
  balance: numeric('balance', { precision: 10, scale: 2 }).notNull().default('0'),
  totalEarnings: numeric('total_earnings', { precision: 10, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('active'), // 'active', 'inactive'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Client-Manager Assignment - Links clients to their assigned managers
export const clientManager = pgTable('client_manager', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  managerId: integer('manager_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAt: text('assigned_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  uniqueClientManager: uniqueIndex('client_manager_client_manager_unique').on(table.clientId, table.managerId),
}));

// Manager Earnings - Tracks earnings per job for managers
export const managerEarnings = pgTable('manager_earnings', {
  id: serial('id').primaryKey(),
  managerId: integer('manager_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  earningType: text('earning_type').notNull(), // 'assign', 'submit', 'completion'
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: text('created_at').notNull(),
});

// User Categories - Track different user groupings for reporting
export const userCategories = pgTable('user_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'client_with_account', 'client_without_account', 'admin', 'freelancer', 'manager'
  assignedAt: text('assigned_at').notNull(),
  assignedBy: integer('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// System Logs - Lightweight error logging table
export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // error, warn, info
  message: text('message').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action'),
  context: text('context'), // JSON string for extra details
  createdAt: text('created_at').notNull(),
});

// 🔴 CRITICAL: Badges System - Achievement badges for users
export const badges = pgTable('badges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  icon: text('icon'), // emoji or icon name
  criteria: text('criteria').notNull(), // JSON: {minRating: 4.8, minJobs: 10}
  category: text('category').notNull(), // 'writer' or 'client'
  color: text('color'), // hex color for badge display
  status: text('status').notNull().default('active'), // 'active', 'inactive'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🔴 CRITICAL: User Badges - Links users to their earned badges
export const userBadges = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: integer('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  badgeName: text('badge_name'), // Denormalized for quick access
  badgeIcon: text('badge_icon'), // Denormalized for quick access
  awardedAt: text('awarded_at').notNull(),
  awardedBy: integer('awarded_by').references(() => users.id, { onDelete: 'set null' }),
  reason: text('reason'),
  description: text('description'),
  createdAt: text('created_at').notNull(),
});

// 🔴 CRITICAL: Payout Requests - Writer withdrawal system
export const payoutRequests = pgTable('payout_requests', {
  id: serial('id').primaryKey(),
  writerId: integer('writer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: text('method').notNull(), // 'mpesa', 'bank'
  accountDetails: text('account_details').notNull(), // JSON string with phone/account info
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected', 'processed'
  requestedAt: text('requested_at').notNull(),
  processedAt: text('processed_at'),
  processedBy: integer('processed_by').references(() => users.id, { onDelete: 'set null' }),
  rejectionReason: text('rejection_reason'),
  transactionReference: text('transaction_reference'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🔒 SECURITY: Admin Audit Logs - Track all admin actions for accountability
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'approve_user', 'reject_user', 'suspend_user', 'confirm_payment', etc.
  targetId: integer('target_id'), // ID of the affected entity (user, payment, job, etc.)
  targetType: text('target_type').notNull(), // 'user', 'payment', 'job', 'payout', etc.
  details: text('details'), // JSON string with additional context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: text('timestamp').notNull(),
  createdAt: text('created_at').notNull(),
});

// 🔴 CRITICAL: Writer Tiers - Level system for writers based on performance
export const writerTiers = pgTable('writer_tiers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'
  minRating: numeric('min_rating', { precision: 10, scale: 2 }).notNull(), // Minimum rating required
  minJobs: integer('min_jobs').notNull(), // Minimum jobs completed
  minSuccessRate: numeric('min_success_rate', { precision: 10, scale: 2 }).notNull(), // Minimum success rate (0-1)
  benefits: text('benefits'), // JSON string with tier perks
  color: text('color'), // hex color for display
  icon: text('icon'), // icon/emoji for display
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟡 Conversations - Message threading system
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  participant1Id: integer('participant1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  participant2Id: integer('participant2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessageAt: text('last_message_at'),
  lastMessageSenderId: integer('last_message_sender_id').references(() => users.id, { onDelete: 'set null' }),
  lastMessagePreview: text('last_message_preview'),
  isArchived: boolean('is_archived').notNull().default(false),
  archivedAt: text('archived_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Freelancer Profiles - Extended profile data for writers
export const freelancerProfiles = pgTable('freelancer_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  skills: text('skills'), // JSON array
  certifications: text('certifications'), // JSON array
  portfolio: text('portfolio'), // JSON with links/attachments
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  languages: text('languages'), // JSON array
  timezone: text('timezone'),
  availability: text('availability').default('part-time'),
  responseTime: integer('response_time'), // in hours
  totalClients: integer('total_clients').default('0'),
  repeatClientRate: numeric('repeat_client_rate', { precision: 10, scale: 2 }).default('0'),
  jobsCompleted: integer('jobs_completed').default('0'),
  isProfileComplete: boolean('is_profile_complete').default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Editor Profiles - Extended profile data for editors (TIER 1 fix)
export const editorProfiles = pgTable('editor_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  specialization: text('specialization'), // e.g., 'grammar', 'plagiarism', 'structure'
  yearsExperience: integer('years_experience'),
  languages: text('languages'), // JSON array
  qualifications: text('qualifications'), // JSON array
  areasOfExpertise: text('areas_of_expertise'), // JSON array
  averageEditsPerOrder: integer('average_edits_per_order').default('0'),
  ordersTouched: integer('orders_touched').default('0'),
  clientSatisfactionRate: numeric('client_satisfaction_rate', { precision: 10, scale: 2 }).default('0'),
  isProfileComplete: boolean('is_profile_complete').default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Editor Assignments - Maps editors to orders (TIER 1 fix)
export const editorAssignments = pgTable('editor_assignments', {
  id: serial('id').primaryKey(),
  editorId: integer('editor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  assignedAt: text('assigned_at').notNull(),
  reviewStartedAt: text('review_started_at'),
  approvalStatus: text('approval_status').notNull().default('pending'), // pending, reviewing, approved, rejected
  approvalReason: text('approval_reason'),
  revisionsRequested: boolean('revisions_requested').notNull().default(false),
  revisionNotes: text('revision_notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Payment Transaction Log - For rollback safety (TIER 1 fix: No Payment Rollback)
export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  transactionType: text('transaction_type').notNull(), // 'payment', 'writer_credit', 'manager_credit', 'admin_commission', 'rollback'
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  balanceBefore: numeric('balance_before', { precision: 10, scale: 2 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('completed'), // completed, pending, failed, rolled_back
  reason: text('reason'),
  createdAt: text('created_at').notNull(),
});

// 🟢 Client Profiles - Extended profile data for clients
export const clientProfiles = pgTable('client_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  industry: text('industry'),
  website: text('website'),
  taxId: text('tax_id'),
  businessRegistration: text('business_registration'),
  billingAddress: text('billing_address'), // JSON
  shippingAddress: text('shipping_address'), // JSON
  preferredPaymentMethod: text('preferred_payment_method'),
  automatePayments: boolean('automate_payments').default(false),
  totalJobsPosted: integer('total_jobs_posted').default('0'),
  totalSpent: numeric('total_spent', { precision: 10, scale: 2 }).default('0'),
  recurringClientDiscount: numeric('recurring_client_discount', { precision: 10, scale: 2 }).default('0'),
  isProfileComplete: boolean('is_profile_complete').default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});