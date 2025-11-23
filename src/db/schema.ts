import { sqliteTable, integer, text, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// NEW: Accounts table for account-linked clients
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountName: text('account_name').notNull().unique(),
  contactPerson: text('contact_person').notNull(),
  contactEmail: text('contact_email').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Domain Management
export const domains = sqliteTable('domains', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  maxUsers: integer('max_users'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🔴 CRITICAL: System Settings - Persistent admin configuration
export const systemSettings = sqliteTable('system_settings', {
  key: text('key').notNull().unique().primaryKey(),
  value: text('value').notNull(),
  type: text('type').notNull(), // 'string', 'number', 'boolean'
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// 🔴 CRITICAL: Invitations Table (for manager/client/writer registration)
export const invitations = sqliteTable('invitations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // 'manager', 'client', 'writer', 'admin'
  token: text('token').notNull().unique(),
  status: text('status').notNull().default('pending'), // 'pending', 'used', 'expired'
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  expiresAt: text('expires_at').notNull(),
  createdByAdminId: integer('created_by_admin_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

// User Management
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  displayId: text('display_id').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // Values: 'admin', 'client', 'freelancer', 'manager', 'editor', 'account_owner'
  approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  balance: real('balance').notNull().default(0),
  earned: real('earned').notNull().default(0),
  totalEarnings: real('total_earnings').notNull().default(0),
  rating: real('rating'),
  // NEW aggregated rating fields
  ratingAverage: real('rating_average').default(0),
  ratingCount: integer('rating_count').default(0),
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
  totalEarned: real('total_earned').notNull().default(0),
  totalSpent: real('total_spent').notNull().default(0),
  completedJobs: integer('completed_jobs').notNull().default(0),
  completionRate: real('completion_rate'),
  profilePictureUrl: text('profile_picture_url'),
  lastLoginAt: text('last_login_at'),
  lastLoginIp: text('last_login_ip'),
  lastLoginDevice: text('last_login_device'),
  loginCount: integer('login_count').notNull().default(0),
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
export const userStats = sqliteTable('user_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalJobsPosted: integer('total_jobs_posted').notNull().default(0),
  totalJobsCompleted: integer('total_jobs_completed').notNull().default(0),
  totalJobsCancelled: integer('total_jobs_cancelled').notNull().default(0),
  totalAmountEarned: real('total_amount_earned').notNull().default(0),
  totalAmountSpent: real('total_amount_spent').notNull().default(0),
  averageRating: real('average_rating'),
  totalRatings: integer('total_ratings').notNull().default(0),
  onTimeDelivery: integer('on_time_delivery').notNull().default(0),
  lateDelivery: integer('late_delivery').notNull().default(0),
  revisionsRequested: integer('revisions_requested').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Jobs Management
export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  displayId: text('display_id').notNull().unique(),
  orderNumber: text('order_number').notNull().unique(),
  orderId: text('order_id').notNull().unique(),
  accountOrderNumber: text('account_order_number'),
  accountLinked: integer('account_linked', { mode: 'boolean' }).notNull().default(false),
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
  amount: real('amount').notNull(),
  managerEarnings: real('manager_earnings').notNull().default(0),
  freelancerEarnings: real('freelancer_earnings').notNull().default(0),
  adminProfit: real('admin_profit').notNull().default(0),
  deadline: text('deadline').notNull(),
  actualDeadline: text('actual_deadline').notNull(),
  freelancerDeadline: text('freelancer_deadline').notNull(),
  requestDraft: integer('request_draft', { mode: 'boolean' }).notNull().default(false),
  draftDelivered: integer('draft_delivered', { mode: 'boolean' }).notNull().default(false),
  requestPrintableSources: integer('request_printable_sources', { mode: 'boolean' }).notNull().default(false),
  singleSpaced: integer('single_spaced', { mode: 'boolean' }).notNull().default(false),
  baseCpp: real('base_cpp'),
  effectiveCpp: real('effective_cpp'),
  status: text('status').notNull().default('pending'),
  // Manager approval gate (TIER 2 fix: Manager reviews before editor)
  managerApproved: integer('manager_approved', { mode: 'boolean' }).notNull().default(false),
  managerApprovedAt: text('manager_approved_at'),
  managerApprovalNotes: text('manager_approval_notes'),
  // Editor approval gate (TIER 1 fix: Editor reviews work)
  assignedEditorId: integer('assigned_editor_id').references(() => users.id, { onDelete: 'set null' }),
  editorApproved: integer('editor_approved', { mode: 'boolean' }).notNull().default(false),
  editorApprovedAt: text('editor_approved_at'),
  editorApprovalNotes: text('editor_approval_notes'),
  adminApproved: integer('admin_approved', { mode: 'boolean' }).notNull().default(false),
  clientApproved: integer('client_approved', { mode: 'boolean' }).notNull().default(false),
  approvedByClientAt: text('approved_by_client_at'),
  revisionRequested: integer('revision_requested', { mode: 'boolean' }).notNull().default(false),
  revisionNotes: text('revision_notes'),
  paymentConfirmed: integer('payment_confirmed', { mode: 'boolean' }).notNull().default(false),
  paidOrderConfirmedAt: text('paid_order_confirmed_at'),
  invoiceGenerated: integer('invoice_generated', { mode: 'boolean' }).notNull().default(false),
  clientRating: integer('client_rating'),
  writerRating: integer('writer_rating'),
  reviewComment: text('review_comment'),
  placementPriority: integer('placement_priority').notNull().default(0),
  urgencyMultiplier: real('urgency_multiplier').notNull().default(1.0),
  calculatedPrice: real('calculated_price'),
  isRealOrder: integer('is_real_order', { mode: 'boolean' }).notNull().default(true),
  // ✅ NEW: Report/Submission flags for file workflow
  requiresReports: integer('requires_reports', { mode: 'boolean' }).notNull().default(true),
  finalSubmissionComplete: integer('final_submission_complete', { mode: 'boolean' }).notNull().default(false),
  revisionSubmissionComplete: integer('revision_submission_complete', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Bids
export const bids = sqliteTable('bids', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message'),
  bidAmount: real('bid_amount').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
});

// Payments
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').references(() => users.id, { onDelete: 'set null' }),
  amount: real('amount').notNull(),
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
  confirmedByAdmin: integer('confirmed_by_admin', { mode: 'boolean' }).notNull().default(false),
  confirmedAt: text('confirmed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Notifications
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Job Messages
export const jobMessages = sqliteTable('job_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  messageType: text('message_type').notNull().default('text'),
  adminApproved: integer('admin_approved', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Ratings
export const ratings = sqliteTable('ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const jobAttachments = sqliteTable('job_attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').references(() => users.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  amount: real('amount').notNull(),
  freelancerAmount: real('freelancer_amount').notNull(),
  adminCommission: real('admin_commission').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('pending'),
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
  paidAt: text('paid_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Messages
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  fileUrl: text('file_url'),
  adminApproved: integer('admin_approved', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Revisions
export const revisions = sqliteTable('revisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  submittedBy: integer('submitted_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  revisionNotes: text('revision_notes'),
  status: text('status').notNull().default('pending_review'),
  sentToFreelancer: integer('sent_to_freelancer', { mode: 'boolean' }).notNull().default(false),
  approvedByAdmin: integer('approved_by_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Email Logs
export const emailLogs = sqliteTable('email_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const jobFiles = sqliteTable('job_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const orderFiles = sqliteTable('order_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const emailVerificationCodes = sqliteTable('email_verification_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Pending Registrations - Store user data before email verification
export const pendingRegistrations = sqliteTable('pending_registrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Payment Requests - New table for client payment request system
export const paymentRequests = sqliteTable('payment_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
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
export const emailNotifications = sqliteTable('email_notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  notificationType: text('notification_type').notNull(),
  sentTo: text('sent_to').notNull(),
  sentAt: text('sent_at').notNull(),
  status: text('status').notNull().default('sent'),
  createdAt: text('created_at').notNull(),
});

// Add new manager_invitations table
export const managerInvitations = sqliteTable('manager_invitations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  token: text('token').notNull().unique(),
  // 🟡 HIGH: Role and status fields for unified invitation system
  role: text('role').default('manager'),
  status: text('status').default('pending'), // 'pending', 'used', 'expired'
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  usedAt: text('used_at'),
  expiresAt: text('expires_at'),
});

// Job Status Logs - Audit trail for all status changes
export const jobStatusLogs = sqliteTable('job_status_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  changedBy: integer('changed_by').references(() => users.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

// 🟡 HIGH: Order History - Comprehensive audit trail (extends job_status_logs)
export const orderHistory = sqliteTable('order_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'Order accepted', 'Writer assigned', 'Delivered', etc.
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }), // Who made the change
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 🟡 HIGH: Writer Balances - Track freelancer earnings separate from users.balance
export const writerBalances = sqliteTable('writer_balances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  writerId: integer('writer_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  availableBalance: real('available_balance').notNull().default(0),
  pendingBalance: real('pending_balance').notNull().default(0),
  totalEarned: real('total_earned').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});

// Manager Profile - Tracks manager-specific information
export const managers = sqliteTable('managers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  phone: text('phone'),
  balance: real('balance').notNull().default(0),
  totalEarnings: real('total_earnings').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active', 'inactive'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Client-Manager Assignment - Links clients to their assigned managers
export const clientManager = sqliteTable('client_manager', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  managerId: integer('manager_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAt: text('assigned_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  uniqueClientManager: uniqueIndex('client_manager_client_manager_unique').on(table.clientId, table.managerId),
}));

// Manager Earnings - Tracks earnings per job for managers
export const managerEarnings = sqliteTable('manager_earnings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  managerId: integer('manager_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  earningType: text('earning_type').notNull(), // 'assign', 'submit', 'completion'
  amount: real('amount').notNull(),
  createdAt: text('created_at').notNull(),
});

// User Categories - Track different user groupings for reporting
export const userCategories = sqliteTable('user_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'client_with_account', 'client_without_account', 'admin', 'freelancer', 'manager'
  assignedAt: text('assigned_at').notNull(),
  assignedBy: integer('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// System Logs - Lightweight error logging table
export const systemLogs = sqliteTable('system_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // error, warn, info
  message: text('message').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action'),
  context: text('context'), // JSON string for extra details
  createdAt: text('created_at').notNull(),
});

// 🔴 CRITICAL: Badges System - Achievement badges for users
export const badges = sqliteTable('badges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const userBadges = sqliteTable('user_badges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const payoutRequests = sqliteTable('payout_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  writerId: integer('writer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
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
export const adminAuditLogs = sqliteTable('admin_audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
export const writerTiers = sqliteTable('writer_tiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'
  minRating: real('min_rating').notNull(), // Minimum rating required
  minJobs: integer('min_jobs').notNull(), // Minimum jobs completed
  minSuccessRate: real('min_success_rate').notNull(), // Minimum success rate (0-1)
  benefits: text('benefits'), // JSON string with tier perks
  color: text('color'), // hex color for display
  icon: text('icon'), // icon/emoji for display
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟡 Conversations - Message threading system
export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  participant1Id: integer('participant1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  participant2Id: integer('participant2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessageAt: text('last_message_at'),
  lastMessageSenderId: integer('last_message_sender_id').references(() => users.id, { onDelete: 'set null' }),
  lastMessagePreview: text('last_message_preview'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  archivedAt: text('archived_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Freelancer Profiles - Extended profile data for writers
export const freelancerProfiles = sqliteTable('freelancer_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  skills: text('skills'), // JSON array
  certifications: text('certifications'), // JSON array
  portfolio: text('portfolio'), // JSON with links/attachments
  hourlyRate: real('hourly_rate'),
  languages: text('languages'), // JSON array
  timezone: text('timezone'),
  availability: text('availability').default('part-time'),
  responseTime: integer('response_time'), // in hours
  totalClients: integer('total_clients').default(0),
  repeatClientRate: real('repeat_client_rate').default(0),
  jobsCompleted: integer('jobs_completed').default(0),
  isProfileComplete: integer('is_profile_complete', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Editor Profiles - Extended profile data for editors (TIER 1 fix)
export const editorProfiles = sqliteTable('editor_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  specialization: text('specialization'), // e.g., 'grammar', 'plagiarism', 'structure'
  yearsExperience: integer('years_experience'),
  languages: text('languages'), // JSON array
  qualifications: text('qualifications'), // JSON array
  areasOfExpertise: text('areas_of_expertise'), // JSON array
  averageEditsPerOrder: integer('average_edits_per_order').default(0),
  ordersTouched: integer('orders_touched').default(0),
  clientSatisfactionRate: real('client_satisfaction_rate').default(0),
  isProfileComplete: integer('is_profile_complete', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Editor Assignments - Maps editors to orders (TIER 1 fix)
export const editorAssignments = sqliteTable('editor_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  editorId: integer('editor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  assignedAt: text('assigned_at').notNull(),
  reviewStartedAt: text('review_started_at'),
  approvalStatus: text('approval_status').notNull().default('pending'), // pending, reviewing, approved, rejected
  approvalReason: text('approval_reason'),
  revisionsRequested: integer('revisions_requested', { mode: 'boolean' }).notNull().default(false),
  revisionNotes: text('revision_notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Payment Transaction Log - For rollback safety (TIER 1 fix: No Payment Rollback)
export const paymentTransactions = sqliteTable('payment_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  paymentId: integer('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  transactionType: text('transaction_type').notNull(), // 'payment', 'writer_credit', 'manager_credit', 'admin_commission', 'rollback'
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  balanceBefore: real('balance_before').notNull(),
  balanceAfter: real('balance_after').notNull(),
  status: text('status').notNull().default('completed'), // completed, pending, failed, rolled_back
  reason: text('reason'),
  createdAt: text('created_at').notNull(),
});

// 🟢 Client Profiles - Extended profile data for clients
export const clientProfiles = sqliteTable('client_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  industry: text('industry'),
  website: text('website'),
  taxId: text('tax_id'),
  businessRegistration: text('business_registration'),
  billingAddress: text('billing_address'), // JSON
  shippingAddress: text('shipping_address'), // JSON
  preferredPaymentMethod: text('preferred_payment_method'),
  automatePayments: integer('automate_payments', { mode: 'boolean' }).default(false),
  totalJobsPosted: integer('total_jobs_posted').default(0),
  totalSpent: real('total_spent').default(0),
  recurringClientDiscount: real('recurring_client_discount').default(0),
  isProfileComplete: integer('is_profile_complete', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 🟢 Client Freelancer History - Track which freelancers have worked for each client
export const clientFreelancerHistory = sqliteTable('client_freelancer_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: integer('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  completedJobsCount: integer('completed_jobs_count').notNull().default(1),
  lastWorkedAt: text('last_worked_at').notNull(),
  avgRating: real('avg_rating'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  uniqueClientFreelancer: uniqueIndex('client_freelancer_unique').on(table.clientId, table.freelancerId),
}));

// 🟢 Freelancer Online Status - Track when freelancers are active/online
export const freelancerOnlineStatus = sqliteTable('freelancer_online_status', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  freelancerId: integer('freelancer_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  isOnline: integer('is_online', { mode: 'boolean' }).notNull().default(false),
  lastSeenAt: text('last_seen_at').notNull(),
  currentJobsCount: integer('current_jobs_count').notNull().default(0),
  onlineStatusUpdatedAt: text('online_status_updated_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// 🟢 Manager Online Status - Track when managers are active/online
export const managerOnlineStatus = sqliteTable('manager_online_status', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  managerId: integer('manager_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  isOnline: integer('is_online', { mode: 'boolean' }).notNull().default(false),
  lastSeenAt: text('last_seen_at').notNull(),
  onlineStatusUpdatedAt: text('online_status_updated_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// 🟢 Client Online Status - Track when clients are active/online
export const clientOnlineStatus = sqliteTable('client_online_status', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  isOnline: integer('is_online', { mode: 'boolean' }).notNull().default(false),
  lastSeenAt: text('last_seen_at').notNull(),
  onlineStatusUpdatedAt: text('online_status_updated_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// 🟠 Freelancer CPP Level Definitions - Define CPP tiers and progression rules
export const freelancerCPPLevels = sqliteTable('freelancer_cpp_levels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: integer('level').notNull().unique(), // 1, 2, 3, 4, 5
  levelName: text('level_name').notNull(), // "Starter", "Rising", "Established", "Expert", "Master"
  description: text('description').notNull(), // Tier description
  completedOrdersRequired: integer('completed_orders_required').notNull(), // Cumulative orders to reach this level
  cppNonTechnical: real('cpp_non_technical').notNull(), // CPP for non-technical work
  cppTechnical: real('cpp_technical').notNull(), // CPP for technical work (+20 markup)
  orderCountInLevel: integer('order_count_in_level').notNull(), // How many orders at this level before progressing
  progressBarColor: text('progress_bar_color').notNull(), // Color for progress visualization
  createdAt: text('created_at').notNull(),
});

// 🟠 Freelancer CPP Progress - Track individual freelancer progression
export const freelancerCPPProgress = sqliteTable('freelancer_cpp_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  freelancerId: integer('freelancer_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  currentLevel: integer('current_level').notNull().default(1), // Current CPP level
  totalCompletedOrders: integer('total_completed_orders').notNull().default(0), // Total lifetime completions
  ordersInCurrentLevel: integer('orders_in_current_level').notNull().default(0), // Progress towards next level
  progressPercentage: real('progress_percentage').notNull().default(0), // 0-100 for progress bar
  nextLevelOrdersRequired: integer('next_level_orders_required').notNull().default(3), // Orders until next level
  isWorkTypeSpecialized: integer('is_work_type_specialized', { mode: 'boolean' }).notNull().default(false), // Technical vs Non-technical focus
  lastProgressUpdate: text('last_progress_update').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});