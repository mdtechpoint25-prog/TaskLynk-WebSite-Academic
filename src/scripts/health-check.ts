#!/usr/bin/env node
/**
 * TaskLynk System Health Check Script
 * Verifies all critical systems are functioning properly
 * 
 * Run: bun src/scripts/health-check.ts
 */

import { db } from '@/db';
import { users, jobs, pendingRegistrations } from '@/db/schema';
import { createClient } from '@libsql/client';

async function checkDatabaseConnection() {
  console.log('📡 Checking database connection...');
  try {
    const result = await db.select().from(users).limit(1);
    console.log('✅ Database connection: OK');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function checkEmailService() {
  console.log('📧 Checking email service...');
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not configured');
      return false;
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'test@tasklynk.co.ke',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }),
    });

    if (response.status === 401 || response.status === 403) {
      console.error('❌ Email service: Invalid API key');
      return false;
    }

    console.log('✅ Email service: OK');
    return true;
  } catch (error) {
    console.error('❌ Email service check failed:', error);
    return false;
  }
}

async function checkCloudinaryService() {
  console.log('☁️  Checking Cloudinary service...');
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('⚠️  Cloudinary credentials not fully configured');
      return false;
    }

    console.log('✅ Cloudinary service: Configured');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary check failed:', error);
    return false;
  }
}

async function checkTableStructures() {
  console.log('📊 Checking table structures...');
  try {
    // Check users table
    const users_check = await db.select().from(users).limit(1);
    console.log('✅ Users table: OK');

    // Check jobs table
    const jobs_check = await db.select().from(jobs).limit(1);
    console.log('✅ Jobs table: OK');

    // Check pending_registrations table
    const pending_check = await db.select().from(pendingRegistrations).limit(1);
    console.log('✅ Pending registrations table: OK');

    return true;
  } catch (error) {
    console.error('❌ Table structure check failed:', error);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('🔑 Checking environment variables...');
  
  const required = [
    'TURSO_CONNECTION_URL',
    'TURSO_AUTH_TOKEN',
    'RESEND_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  let allPresent = true;
  for (const key of required) {
    const value = process.env[key];
    if (value) {
      console.log(`✅ ${key}: Set`);
    } else {
      console.warn(`⚠️  ${key}: Not set`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function runHealthCheck() {
  console.log('\n🏥 TaskLynk System Health Check\n' + '='.repeat(40) + '\n');

  const checks = [
    checkEnvironmentVariables(),
    checkDatabaseConnection(),
    checkTableStructures(),
    checkEmailService(),
    checkCloudinaryService(),
  ];

  const results = await Promise.allSettled(checks);
  
  const passed = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const total = results.length;

  console.log('\n' + '='.repeat(40));
  console.log(`\n📋 Results: ${passed}/${total} checks passed\n`);

  if (passed === total) {
    console.log('✅ All systems operational!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some systems need attention. See errors above.\n');
    process.exit(1);
  }
}

runHealthCheck().catch(err => {
  console.error('❌ Health check failed:', err);
  process.exit(1);
});
