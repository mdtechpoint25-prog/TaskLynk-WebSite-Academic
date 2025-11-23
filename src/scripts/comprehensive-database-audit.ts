import { createClient } from '@libsql/client';

const TURSO_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url: TURSO_URL!,
  authToken: TURSO_TOKEN!,
});

// Define all expected tables with their critical columns
const EXPECTED_TABLES: Record<string, { table: string; criticalColumns: string[] }> = {
  users: { table: 'users', criticalColumns: ['id', 'email', 'role', 'display_id', 'password'] },
  jobs: { table: 'jobs', criticalColumns: ['id', 'client_id', 'display_id', 'order_number', 'status'] },
  submissions: { table: 'submissions', criticalColumns: ['id', 'job_id', 'writer_id', 'submission_type', 'status'] },
  submission_files: { table: 'submission_files', criticalColumns: ['id', 'submission_id', 'file_url'] },
  bids: { table: 'bids', criticalColumns: ['id', 'job_id', 'freelancer_id', 'status'] },
  payments: { table: 'payments', criticalColumns: ['id', 'job_id', 'status', 'amount'] },
  manager_invitations: { table: 'manager_invitations', criticalColumns: ['id', 'email', 'token', 'status'] },
  job_attachments: { table: 'job_attachments', criticalColumns: ['id', 'job_id', 'file_url'] },
  order_files: { table: 'order_files', criticalColumns: ['id', 'order_id', 'file_url'] },
  pending_registrations: { table: 'pending_registrations', criticalColumns: ['id', 'email', 'verification_code'] },
  messages: { table: 'messages', criticalColumns: ['id', 'sender_id', 'receiver_id'] },
  email_verification_codes: { table: 'email_verification_codes', criticalColumns: ['id', 'user_id', 'code'] },
  admin_audit_logs: { table: 'admin_audit_logs', criticalColumns: ['id', 'admin_id', 'action'] },
  writers: { table: 'writers', criticalColumns: ['id', 'user_id'] },
  managers: { table: 'managers', criticalColumns: ['id', 'user_id'] },
};

// Define expected environment variables
const REQUIRED_ENV_VARS = [
  'TURSO_CONNECTION_URL',
  'TURSO_AUTH_TOKEN',
  'RESEND_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'PAYSTACK_SECRET_KEY',
];

async function checkEnvironmentVariables() {
  console.log('\n🔧 ===== ENVIRONMENT VARIABLES CHECK =====');
  const missing = [];
  const configured = [];

  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (value) {
      configured.push(varName);
      console.log(`✅ ${varName} - configured`);
    } else {
      missing.push(varName);
      console.log(`❌ ${varName} - MISSING`);
    }
  }

  console.log(`\n✅ Configured: ${configured.length}/${REQUIRED_ENV_VARS.length}`);
  if (missing.length > 0) {
    console.log(`❌ Missing: ${missing.join(', ')}`);
  }
  return missing.length === 0;
}

async function checkDatabaseConnection() {
  console.log('\n🔗 ===== DATABASE CONNECTION CHECK =====');
  try {
    const result = await client.execute('SELECT 1 as connection_test');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function checkAllTables() {
  console.log('\n📋 ===== DATABASE TABLES CHECK =====');
  const results: Record<string, { exists: boolean; columns: string[] }> = {};

  for (const [key, config] of Object.entries(EXPECTED_TABLES)) {
    try {
      const tableCheck = await client.execute(`PRAGMA table_info(${config.table})`);
      const columns = tableCheck.rows.map((row: any) => row.name);
      const missingColumns = config.criticalColumns.filter(col => !columns.includes(col));

      results[key] = { exists: true, columns };

      if (missingColumns.length === 0) {
        console.log(`✅ ${config.table} - ${columns.length} columns`);
      } else {
        console.log(`⚠️  ${config.table} - MISSING COLUMNS: ${missingColumns.join(', ')}`);
      }
    } catch (error) {
      results[key] = { exists: false, columns: [] };
      console.log(`❌ ${config.table} - TABLE DOES NOT EXIST`);
    }
  }

  const existingTables = Object.values(results).filter(r => r.exists).length;
  console.log(`\n✅ Existing: ${existingTables}/${Object.keys(EXPECTED_TABLES).length} tables`);
  return existingTables === Object.keys(EXPECTED_TABLES).length;
}

async function checkDataIntegrity() {
  console.log('\n🔍 ===== DATA INTEGRITY CHECK =====');

  // Check users table
  try {
    const usersCount = await client.execute('SELECT COUNT(*) as total FROM users');
    const total = (usersCount.rows[0] as any).total;
    console.log(`✅ Users: ${total} total`);

    // Check for different roles
    const roleCheck = await client.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    for (const row of roleCheck.rows) {
      console.log(`   - ${(row as any).role}: ${(row as any).count}`);
    }
  } catch (error) {
    console.log('❌ Failed to check users:', error instanceof Error ? error.message : error);
  }

  // Check jobs table
  try {
    const jobsCount = await client.execute('SELECT COUNT(*) as total FROM jobs');
    const total = (jobsCount.rows[0] as any).total;
    console.log(`✅ Jobs: ${total} total`);

    // Check job statuses
    const statusCheck = await client.execute(`
      SELECT status, COUNT(*) as count 
      FROM jobs 
      GROUP BY status
    `);
    for (const row of statusCheck.rows) {
      console.log(`   - ${(row as any).status}: ${(row as any).count}`);
    }
  } catch (error) {
    console.log('❌ Failed to check jobs:', error instanceof Error ? error.message : error);
  }

  // Check submissions
  try {
    const submissionsCount = await client.execute('SELECT COUNT(*) as total FROM submissions');
    const total = (submissionsCount.rows[0] as any).total;
    console.log(`✅ Submissions: ${total} total`);
  } catch (error) {
    console.log('❌ Failed to check submissions:', error instanceof Error ? error.message : error);
  }

  // Check payments
  try {
    const paymentsCount = await client.execute('SELECT COUNT(*) as total FROM payments');
    const total = (paymentsCount.rows[0] as any).total;
    console.log(`✅ Payments: ${total} total`);

    const statusCheck = await client.execute(`
      SELECT status, COUNT(*) as count 
      FROM payments 
      GROUP BY status
    `);
    for (const row of statusCheck.rows) {
      console.log(`   - ${(row as any).status}: ${(row as any).count}`);
    }
  } catch (error) {
    console.log('❌ Failed to check payments:', error instanceof Error ? error.message : error);
  }

  // Check manager invitations
  try {
    const invitationsCount = await client.execute('SELECT COUNT(*) as total FROM manager_invitations');
    const total = (invitationsCount.rows[0] as any).total;
    console.log(`✅ Manager Invitations: ${total} total`);
  } catch (error) {
    console.log('❌ Failed to check manager_invitations:', error instanceof Error ? error.message : error);
  }
}

async function checkForeignKeyRelationships() {
  console.log('\n🔗 ===== FOREIGN KEY RELATIONSHIPS CHECK =====');

  try {
    // Check if submissions reference valid jobs
    const orphanedSubmissions = await client.execute(`
      SELECT s.id, s.job_id 
      FROM submissions s 
      LEFT JOIN jobs j ON s.job_id = j.id 
      WHERE j.id IS NULL 
      LIMIT 10
    `);
    if (orphanedSubmissions.rows.length > 0) {
      console.log(`⚠️  Found ${orphanedSubmissions.rows.length} orphaned submissions (job_id references non-existent job)`);
    } else {
      console.log('✅ All submissions reference valid jobs');
    }

    // Check if submission_files reference valid submissions
    const orphanedFiles = await client.execute(`
      SELECT sf.id, sf.submission_id 
      FROM submission_files sf 
      LEFT JOIN submissions s ON sf.submission_id = s.id 
      WHERE s.id IS NULL 
      LIMIT 10
    `);
    if (orphanedFiles.rows.length > 0) {
      console.log(`⚠️  Found ${orphanedFiles.rows.length} orphaned submission files`);
    } else {
      console.log('✅ All submission files reference valid submissions');
    }

    // Check if jobs reference valid clients
    const orphanedJobs = await client.execute(`
      SELECT j.id, j.client_id 
      FROM jobs j 
      LEFT JOIN users u ON j.client_id = u.id 
      WHERE u.id IS NULL 
      LIMIT 10
    `);
    if (orphanedJobs.rows.length > 0) {
      console.log(`⚠️  Found ${orphanedJobs.rows.length} orphaned jobs (client_id references non-existent user)`);
    } else {
      console.log('✅ All jobs reference valid clients');
    }

  } catch (error) {
    console.log('❌ Failed to check foreign key relationships:', error instanceof Error ? error.message : error);
  }
}

async function checkStorageConfiguration() {
  console.log('\n💾 ===== STORAGE CONFIGURATION CHECK =====');

  const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET?.substring(0, 5) + '***', // Mask secret
  };

  if (cloudinaryConfig.cloud_name && cloudinaryConfig.api_key) {
    console.log('✅ Cloudinary configured:');
    console.log(`   Cloud: ${cloudinaryConfig.cloud_name}`);
    console.log(`   API Key: ${cloudinaryConfig.api_key}`);
    console.log(`   API Secret: ${cloudinaryConfig.api_secret}`);
  } else {
    console.log('❌ Cloudinary not properly configured');
  }

  // Check file attachments in database
  try {
    const attachmentsCount = await client.execute('SELECT COUNT(*) as total FROM job_attachments');
    const total = (attachmentsCount.rows[0] as any).total;
    console.log(`✅ File attachments in database: ${total}`);
  } catch (error) {
    console.log('❌ Failed to check file attachments:', error instanceof Error ? error.message : error);
  }
}

async function checkWorkflows() {
  console.log('\n🔄 ===== WORKFLOW CHECKS =====');

  // Check registration to verification flow
  try {
    const pendingCount = await client.execute('SELECT COUNT(*) as total FROM pending_registrations');
    const total = (pendingCount.rows[0] as any).total;
    console.log(`✅ Pending registrations: ${total}`);

    const verificationCodesCount = await client.execute('SELECT COUNT(*) as total FROM email_verification_codes');
    const codeTotal = (verificationCodesCount.rows[0] as any).total;
    console.log(`✅ Email verification codes: ${codeTotal}`);
  } catch (error) {
    console.log('❌ Registration workflow check failed:', error instanceof Error ? error.message : error);
  }

  // Check freelancer workflow: job -> bid -> assignment -> submission
  try {
    const jobsWithAssignments = await client.execute(`
      SELECT COUNT(*) as assigned_jobs 
      FROM jobs 
      WHERE assigned_freelancer_id IS NOT NULL
    `);
    const assignedCount = (jobsWithAssignments.rows[0] as any).assigned_jobs;
    console.log(`✅ Jobs assigned to freelancers: ${assignedCount}`);

    const jobsWithSubmissions = await client.execute(`
      SELECT COUNT(DISTINCT j.id) as jobs_with_submissions
      FROM jobs j
      JOIN submissions s ON j.id = s.job_id
    `);
    const submissionCount = (jobsWithSubmissions.rows[0] as any).jobs_with_submissions;
    console.log(`✅ Jobs with submissions: ${submissionCount}`);
  } catch (error) {
    console.log('❌ Freelancer workflow check failed:', error instanceof Error ? error.message : error);
  }

  // Check manager invitation workflow
  try {
    const managerInvitations = await client.execute(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
      FROM manager_invitations
    `);
    const row = managerInvitations.rows[0] as any;
    console.log(`✅ Manager invitations:`);
    console.log(`   - Pending: ${row.pending || 0}`);
    console.log(`   - Used: ${row.used || 0}`);
    console.log(`   - Expired: ${row.expired || 0}`);
  } catch (error) {
    console.log('❌ Manager invitation workflow check failed:', error instanceof Error ? error.message : error);
  }
}

async function runAudit() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   TaskLynk Comprehensive Database & System Audit          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const envOk = await checkEnvironmentVariables();
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    console.log('\n❌ Cannot continue without database connection');
    process.exit(1);
  }

  await checkAllTables();
  await checkDataIntegrity();
  await checkForeignKeyRelationships();
  await checkStorageConfiguration();
  await checkWorkflows();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Audit Complete                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await client.close();
}

runAudit().catch(console.error);
