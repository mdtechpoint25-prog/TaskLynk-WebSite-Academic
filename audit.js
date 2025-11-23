#!/usr/bin/env node

/**
 * TASKLYNK SYSTEM AUDIT - Database, Storage, and User Workflows
 * Comprehensive diagnostic of all systems
 */

const fs = require('fs');
const path = require('path');

// CheckResult is an object with the following structure:
// { category, name, status, message, details }

const results = [];

function check(category, name, status, message, details) {
  results.push({ category, name, status, message, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${name}: ${message}`);
}

// ============================================================================
// ENVIRONMENT CHECKS
// ============================================================================

function auditEnvironment() {
  console.log('\n🔐 AUDITING ENVIRONMENT VARIABLES');
  console.log('═'.repeat(60));

  const envFile = path.join(process.cwd(), '.env');
  const envExampleFile = path.join(process.cwd(), '.env.example');

  // Check if .env exists
  if (fs.existsSync(envFile)) {
    check('Environment', '.env File', 'PASS', 'Configuration file exists');
    const envContent = fs.readFileSync(envFile, 'utf-8');
    
    // Check required variables
    const requiredVars = [
      { name: 'DATABASE_URL', pattern: /DATABASE_URL=/ },
      { name: 'RESEND_API_KEY', pattern: /RESEND_API_KEY=/ },
      { name: 'CLOUDINARY_CLOUD_NAME', pattern: /CLOUDINARY_CLOUD_NAME=/ },
      { name: 'CLOUDINARY_API_KEY', pattern: /CLOUDINARY_API_KEY=/ },
      { name: 'CLOUDINARY_API_SECRET', pattern: /CLOUDINARY_API_SECRET=/ },
    ];

    for (const envVar of requiredVars) {
      if (envVar.pattern.test(envContent)) {
        check('Environment', envVar.name, 'PASS', 'Variable is configured');
      } else {
        check('Environment', envVar.name, 'FAIL', 'Variable not found');
      }
    }
  } else {
    check('Environment', '.env File', 'FAIL', '.env file not found - copy from .env.example');
  }

  // Check .env.example
  if (fs.existsSync(envExampleFile)) {
    check('Environment', '.env.example', 'PASS', 'Example configuration exists');
  }
}

// ============================================================================
// DATABASE SCHEMA CHECKS
// ============================================================================

function auditDatabaseSchema() {
  console.log('\n💾 AUDITING DATABASE SCHEMA');
  console.log('═'.repeat(60));

  const schemaFile = path.join(process.cwd(), 'src', 'db', 'schema.ts');
  
  if (!fs.existsSync(schemaFile)) {
    check('Schema', 'File Existence', 'FAIL', 'schema.ts not found');
    return;
  }

  check('Schema', 'File Existence', 'PASS', 'schema.ts exists');

  const schemaContent = fs.readFileSync(schemaFile, 'utf-8');

  // Check for critical tables
  const requiredTables = [
    { name: 'users', required: true },
    { name: 'jobs', required: true },
    { name: 'submissions', required: true },
    { name: 'submissionFiles', required: true },
    { name: 'payments', required: true },
    { name: 'managerInvitations', required: true },
    { name: 'orderFiles', required: true },
    { name: 'managers', required: true },
    { name: 'freelancerProfiles', required: true },
    { name: 'messages', required: true },
    { name: 'ratings', required: true },
    { name: 'invoices', required: true },
    { name: 'jobAttachments', required: true },
  ];

  for (const table of requiredTables) {
    const pattern = new RegExp(`export const ${table.name} = pgTable\\(|export const ${table.name} = pgTable\\(`);
    if (pattern.test(schemaContent)) {
      check('Schema', `Table: ${table.name}`, 'PASS', 'Table definition exists');
    } else {
      const status = table.required ? 'FAIL' : 'WARN';
      check('Schema', `Table: ${table.name}`, status, `Table definition not found`);
    }
  }
}

// ============================================================================
// API ROUTES CHECKS
// ============================================================================

function auditAPIRoutes() {
  console.log('\n🛣️  AUDITING API ROUTES');
  console.log('═'.repeat(60));

  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

  const requiredRoutes = [
    'auth/register',
    'auth/verify-code',
    'auth/login',
    'jobs',
    'jobs/[id]/submit',
    'jobs/[id]/assign',
    'admin/invite-manager',
    'cloudinary/upload',
  ];

  for (const route of requiredRoutes) {
    const routePath = path.join(apiDir, route, 'route.ts');
    if (fs.existsSync(routePath)) {
      check('API Routes', route, 'PASS', 'Route exists');
    } else {
      check('API Routes', route, 'FAIL', 'Route not found');
    }
  }
}

// ============================================================================
// PAGE ROUTES CHECKS
// ============================================================================

function auditPageRoutes() {
  console.log('\n📄 AUDITING PAGE ROUTES');
  console.log('═'.repeat(60));

  const appDir = path.join(process.cwd(), 'src', 'app');

  const requiredPages = [
    { path: 'register', description: 'User registration' },
    { path: 'verify-email', description: 'Email verification' },
    { path: 'login', description: 'Login page' },
    { path: 'client', description: 'Client dashboard' },
    { path: 'freelancer', description: 'Freelancer dashboard' },
    { path: 'admin', description: 'Admin dashboard' },
    { path: 'manager', description: 'Manager dashboard' },
    { path: 'admin/user-management', description: 'User management' },
    { path: 'admin/managers', description: 'Manager management' },
    { path: 'freelancer/submit-work', description: 'Work submission' },
    { path: 'client/new-job', description: 'Create job' },
  ];

  for (const page of requiredPages) {
    const pagePath = path.join(appDir, page.path);
    const hasPage = fs.existsSync(pagePath) && (
      fs.existsSync(path.join(pagePath, 'page.tsx')) ||
      fs.existsSync(path.join(pagePath, 'page.ts'))
    );
    
    if (hasPage) {
      check('Pages', page.description, 'PASS', `Found at ${page.path}`);
    } else {
      check('Pages', page.description, 'WARN', `Page not found at ${page.path}`);
    }
  }
}

// ============================================================================
// CONFIGURATION CHECKS
// ============================================================================

function auditConfiguration() {
  console.log('\n⚙️  AUDITING CONFIGURATION FILES');
  console.log('═'.repeat(60));

  const requiredFiles = [
    { path: 'drizzle.config.ts', name: 'Drizzle ORM Configuration' },
    { path: 'src/db/index.ts', name: 'Database Connection' },
    { path: 'package.json', name: 'Package Configuration' },
    { path: 'tsconfig.json', name: 'TypeScript Configuration' },
    { path: 'next.config.ts', name: 'Next.js Configuration' },
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      check('Config', file.name, 'PASS', `${file.path} exists`);
    } else {
      check('Config', file.name, 'FAIL', `${file.path} not found`);
    }
  }
}

// ============================================================================
// CRITICAL FEATURES CHECK
// ============================================================================

function auditCriticalFeatures() {
  console.log('\n⭐ AUDITING CRITICAL FEATURES');
  console.log('═'.repeat(60));

  // Check for submission workflow
  const submitRoute = path.join(process.cwd(), 'src', 'app', 'api', 'jobs', '[id]', 'submit', 'route.ts');
  const submitContent = fs.readFileSync(submitRoute, 'utf-8');
  
  if (submitContent.includes('submissionFiles') || submitContent.includes('orderFiles')) {
    check('Features', 'Freelancer Submission', 'PASS', 'Submission workflow implemented');
  } else {
    check('Features', 'Freelancer Submission', 'WARN', 'Submission workflow may be incomplete');
  }

  // Check for manager invitation
  const inviteRoute = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'invite-manager', 'route.ts');
  if (fs.existsSync(inviteRoute)) {
    check('Features', 'Manager Invitation', 'PASS', 'Manager invitation system exists');
  } else {
    check('Features', 'Manager Invitation', 'FAIL', 'Manager invitation system not found');
  }

  // Check for Cloudinary integration
  const uploadRoute = path.join(process.cwd(), 'src', 'app', 'api', 'cloudinary', 'upload', 'route.ts');
  if (fs.existsSync(uploadRoute)) {
    check('Features', 'File Upload (Cloudinary)', 'PASS', 'File upload system exists');
  } else {
    check('Features', 'File Upload (Cloudinary)', 'FAIL', 'File upload system not found');
  }

  // Check for payment system
  const paymentsDir = path.join(process.cwd(), 'src', 'app', 'api', 'payments');
  if (fs.existsSync(paymentsDir)) {
    check('Features', 'Payment System', 'PASS', 'Payment system directory exists');
  } else {
    check('Features', 'Payment System', 'WARN', 'Payment system directory not found');
  }
}

// ============================================================================
// DIRECTORY STRUCTURE CHECK
// ============================================================================

function auditDirectoryStructure() {
  console.log('\n📁 AUDITING DIRECTORY STRUCTURE');
  console.log('═'.repeat(60));

  const srcDir = path.join(process.cwd(), 'src');
  const requiredDirs = [
    'app',
    'app/api',
    'components',
    'lib',
    'db',
    'db/schema.ts',
    'scripts',
  ];

  for (const dir of requiredDirs) {
    const dirPath = path.join(srcDir, dir);
    const isDir = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    const isFile = fs.existsSync(dirPath) && fs.statSync(dirPath).isFile();
    
    if (isDir || isFile) {
      check('Directory', dir, 'PASS', 'Exists');
    } else {
      check('Directory', dir, 'FAIL', 'Missing');
    }
  }
}

// ============================================================================
// DATABASE CONNECTION CHECK
// ============================================================================

function auditDatabaseConnection() {
  console.log('\n🔌 AUDITING DATABASE CONNECTION');
  console.log('═'.repeat(60));

  const dbIndexFile = path.join(process.cwd(), 'src', 'db', 'index.ts');
  
  if (!fs.existsSync(dbIndexFile)) {
    check('Database', 'Connection File', 'FAIL', 'src/db/index.ts not found');
    return;
  }

  const dbContent = fs.readFileSync(dbIndexFile, 'utf-8');

  // Check for connection setup
  if (dbContent.includes('DATABASE_URL')) {
    check('Database', 'Connection Variable', 'PASS', 'Uses DATABASE_URL from environment');
  } else if (dbContent.includes('TURSO_CONNECTION_URL')) {
    check('Database', 'Connection Variable', 'PASS', 'Uses TURSO_CONNECTION_URL from environment');
  } else {
    check('Database', 'Connection Variable', 'FAIL', 'No database connection variable found');
  }

  // Check for Drizzle ORM
  if (dbContent.includes('drizzle')) {
    check('Database', 'ORM Setup', 'PASS', 'Drizzle ORM configured');
  } else {
    check('Database', 'ORM Setup', 'FAIL', 'Drizzle ORM not configured');
  }

  // Check for schema import
  if (dbContent.includes('schema')) {
    check('Database', 'Schema Import', 'PASS', 'Schema imported');
  } else {
    check('Database', 'Schema Import', 'FAIL', 'Schema not imported');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function printSummary() {
  console.log('\n\n📊 AUDIT SUMMARY');
  console.log('═'.repeat(60));

  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    console.log(`\n${category}:`);
    for (const result of categoryResults) {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${icon} ${result.name}: ${result.status}`);
    }
  }

  // Calculate totals
  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.status === 'PASS').length;
  const failedChecks = results.filter(r => r.status === 'FAIL').length;
  const warnedChecks = results.filter(r => r.status === 'WARN').length;

  console.log('\n\n📈 FINAL RESULTS');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
  console.log(`❌ Failed: ${failedChecks}/${totalChecks}`);
  console.log(`⚠️  Warnings: ${warnedChecks}/${totalChecks}`);

  if (failedChecks === 0) {
    console.log('\n🎉 SYSTEM READY FOR TESTING!');
    console.log('\nNext Steps:');
    console.log('1. Build the application: npm run build');
    console.log('2. Start development server: npm run dev');
    console.log('3. Test registration flow at /register');
    console.log('4. Test manager invitation in admin panel');
    console.log('5. Test freelancer submission workflow');
  } else {
    console.log(`\n⚠️  ${failedChecks} critical issues need attention before deployment`);
  }

  process.exit(failedChecks > 0 ? 1 : 0);
}

// ============================================================================
// RUN AUDIT
// ============================================================================

console.log('\n');
console.log('🔍 TASKLYNK COMPREHENSIVE SYSTEM AUDIT');
console.log('════════════════════════════════════════════════════════════════');
console.log(`Started: ${new Date().toLocaleString()}`);
console.log(`Location: ${process.cwd()}`);

try {
  auditEnvironment();
  auditDatabaseConnection();
  auditDatabaseSchema();
  auditConfiguration();
  auditDirectoryStructure();
  auditAPIRoutes();
  auditPageRoutes();
  auditCriticalFeatures();
  printSummary();
} catch (error) {
  console.error('\n❌ Audit failed with error:', error);
  process.exit(1);
}
