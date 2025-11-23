#!/usr/bin/env bun

/**
 * COMPREHENSIVE DATABASE & SYSTEM AUDIT
 * Verifies all database connections, tables, storage, and workflows
 */

import { db } from '@/db';
import { 
  users, jobs, submissions, managers, managerInvitations, 
  managerEarnings, orderFiles, submissions as submissionsTable,
  submissionFiles, jobAttachments, payments, bids, 
  pendingRegistrations, writers, writerWallets
} from '@/db/schema';
import { eq, count } from 'drizzle-orm';

interface AuditResult {
  category: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

const results: AuditResult[] = [];

function logResult(category: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
  results.push({ category, status, message, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${message}`);
  if (details) console.log('   Details:', details);
}

async function auditDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 TASKLYNK COMPREHENSIVE SYSTEM AUDIT');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Database Connection
    console.log('📡 CHECKING DATABASE CONNECTION...\n');
    try {
      const testUsers = await db.select({ id: users.id }).from(users).limit(1);
      logResult('Database', 'PASS', 'Database connection successful', { rowsReturned: testUsers.length });
    } catch (error: any) {
      logResult('Database', 'FAIL', 'Database connection failed', { error: error.message });
      throw error;
    }

    // 2. Environment Variables
    console.log('\n📋 CHECKING ENVIRONMENT VARIABLES...\n');
    const requiredEnvs = [
      'DATABASE_URL',
      'RESEND_API_KEY',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'NEXT_PUBLIC_APP_URL',
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET',
      'PAYSTACK_SECRET_KEY'
    ];

    for (const envVar of requiredEnvs) {
      const value = process.env[envVar];
      if (value) {
        logResult('Environment', 'PASS', `${envVar} configured`);
      } else {
        logResult('Environment', 'WARNING', `${envVar} not configured`);
      }
    }

    // 3. Database Tables
    console.log('\n📊 CHECKING DATABASE TABLES...\n');
    
    const tablesToCheck = [
      { name: 'users', table: users },
      { name: 'jobs (orders)', table: jobs },
      { name: 'submissions', table: submissionsTable },
      { name: 'submission_files', table: submissionFiles },
      { name: 'job_attachments', table: jobAttachments },
      { name: 'order_files', table: orderFiles },
      { name: 'managers', table: managers },
      { name: 'manager_invitations', table: managerInvitations },
      { name: 'manager_earnings', table: managerEarnings },
      { name: 'payments', table: payments },
      { name: 'bids', table: bids },
      { name: 'pending_registrations', table: pendingRegistrations },
      { name: 'writers', table: writers },
      { name: 'writer_wallets', table: writerWallets },
    ];

    for (const { name, table } of tablesToCheck) {
      try {
        const [result] = await db.select({ count: count() }).from(table as any);
        const rowCount = result.count;
        logResult('Tables', 'PASS', `${name} table exists`, { rowCount });
      } catch (error: any) {
        logResult('Tables', 'FAIL', `${name} table error`, { error: error.message });
      }
    }

    // 4. User Roles Verification
    console.log('\n👥 CHECKING USER ROLES...\n');
    try {
      const usersByRole = await db.select().from(users).limit(100);
      const roleStats = usersByRole.reduce((acc: any, user: any) => {
        const role = user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      logResult('User Roles', 'PASS', 'User role distribution', { roleStats });

      // Check for admin users
      const admins = usersByRole.filter(u => u.role === 'admin');
      if (admins.length > 0) {
        logResult('Admins', 'PASS', `Found ${admins.length} admin user(s)`);
      } else {
        logResult('Admins', 'WARNING', 'No admin users found in system');
      }
    } catch (error: any) {
      logResult('User Roles', 'FAIL', 'Failed to check user roles', { error: error.message });
    }

    // 5. Jobs/Orders Verification
    console.log('\n📦 CHECKING JOBS/ORDERS...\n');
    try {
      const [jobStats] = await db.select({ count: count() }).from(jobs);
      logResult('Orders', 'PASS', `Found ${jobStats.count} orders in system`);

      // Check order status distribution
      const jobSample = await db.select().from(jobs).limit(20);
      const statusDistribution = jobSample.reduce((acc: any, job: any) => {
        const status = job.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      logResult('Order Status', 'PASS', 'Order status distribution', statusDistribution);
    } catch (error: any) {
      logResult('Orders', 'FAIL', 'Failed to check orders', { error: error.message });
    }

    // 6. Submissions/Upload Workflow
    console.log('\n📤 CHECKING FREELANCER SUBMISSIONS...\n');
    try {
      const [submissionStats] = await db.select({ count: count() }).from(submissionsTable);
      logResult('Submissions', 'PASS', `Found ${submissionStats.count} submissions`);

      const [orderFilesStats] = await db.select({ count: count() }).from(orderFiles);
      logResult('Order Files', 'PASS', `Found ${orderFilesStats.count} order files uploaded`);

      const [attachmentStats] = await db.select({ count: count() }).from(jobAttachments);
      logResult('Attachments', 'PASS', `Found ${attachmentStats.count} job attachments`);
    } catch (error: any) {
      logResult('Submissions', 'FAIL', 'Failed to check submissions', { error: error.message });
    }

    // 7. Manager System
    console.log('\n👔 CHECKING MANAGER SYSTEM...\n');
    try {
      const [managerStats] = await db.select({ count: count() }).from(managers);
      logResult('Manager Profiles', 'PASS', `Found ${managerStats.count} manager profiles`);

      const [invitationStats] = await db.select({ count: count() }).from(managerInvitations);
      logResult('Manager Invitations', 'PASS', `Found ${invitationStats.count} manager invitations`);

      const [earningStats] = await db.select({ count: count() }).from(managerEarnings);
      logResult('Manager Earnings', 'PASS', `Found ${earningStats.count} earning records`);
    } catch (error: any) {
      logResult('Manager System', 'FAIL', 'Failed to check manager system', { error: error.message });
    }

    // 8. Payment System
    console.log('\n💳 CHECKING PAYMENT SYSTEM...\n');
    try {
      const [paymentStats] = await db.select({ count: count() }).from(payments);
      logResult('Payments', 'PASS', `Found ${paymentStats.count} payment records`);

      const [bidStats] = await db.select({ count: count() }).from(bids);
      logResult('Bids', 'PASS', `Found ${bidStats.count} freelancer bids`);
    } catch (error: any) {
      logResult('Payments', 'FAIL', 'Failed to check payments', { error: error.message });
    }

    // 9. Authentication Flow
    console.log('\n🔐 CHECKING AUTHENTICATION...\n');
    try {
      const [pendingStats] = await db.select({ count: count() }).from(pendingRegistrations);
      logResult('Pending Registrations', 'PASS', `Found ${pendingStats.count} pending registrations`);
    } catch (error: any) {
      logResult('Authentication', 'FAIL', 'Failed to check authentication', { error: error.message });
    }

    // 10. Storage Configuration
    console.log('\n💾 CHECKING STORAGE CONFIGURATION...\n');
    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    if (cloudinaryConfigured) {
      logResult('Cloudinary', 'PASS', 'Cloudinary configured');
    } else {
      logResult('Cloudinary', 'FAIL', 'Cloudinary not configured');
    }

    // 11. Email Service
    console.log('\n📧 CHECKING EMAIL SERVICE...\n');
    const emailConfigured = !!process.env.RESEND_API_KEY;
    if (emailConfigured) {
      logResult('Email Service', 'PASS', 'Resend API configured');
    } else {
      logResult('Email Service', 'WARNING', 'Resend API not configured - email sending disabled');
    }

    // 12. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(60) + '\n');

    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const warningCount = results.filter(r => r.status === 'WARNING').length;

    console.log(`✅ PASSED: ${passCount}`);
    console.log(`❌ FAILED: ${failCount}`);
    console.log(`⚠️  WARNINGS: ${warningCount}`);
    console.log(`📈 TOTAL CHECKS: ${results.length}`);

    if (failCount === 0) {
      console.log('\n🎉 All critical systems operational!');
    } else {
      console.log(`\n⚠️  ${failCount} critical issue(s) found. Please review above.`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run audit
auditDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
