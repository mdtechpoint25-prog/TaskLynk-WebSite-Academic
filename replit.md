# TaskLynk - Freelance Management Platform

## Overview
TaskLynk is a comprehensive freelance management platform built with Next.js 15, featuring job posting, writer/client management, payment processing, and real-time messaging.

## Tech Stack
- **Frontend/Backend**: Next.js 15 (App Router)
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Storage**: Supabase for file storage
- **Payment Processing**: M-Pesa (Safaricom), Paystack
- **Email**: Resend
- **Package Manager**: Bun

## Project Structure
```
src/
├── app/           # Next.js App Router pages and API routes
│   ├── api/       # API endpoints (admin, auth, jobs, payments, etc.)
│   ├── client/    # Client dashboard pages
│   ├── freelancer/# Freelancer dashboard pages
│   └── manager/   # Manager dashboard pages
├── db/            # Database schema and configuration
├── lib/           # Utility libraries
├── components/    # React components
└── scripts/       # Database setup scripts
```

## Key Features
- Multi-role system (Admin, Client, Freelancer, Manager, Editor, Account Owner)
- Job/Order management with lifecycle tracking
- Real-time messaging and notifications
- Payment processing (M-Pesa, Paystack)
- File upload and management via Supabase
- Financial tracking and invoicing
- User rating and badge system
- Domain-based user organization

## Development Setup

### ✅ Fully Replit-Native Setup Complete!

The application now uses 100% Replit-managed services with no external dependencies:

**Database (Replit PostgreSQL):**
- ✅ `DATABASE_URL` - Automatically configured with Replit PostgreSQL
- ✅ All database tables created and initialized
- ✅ Schema: 40+ tables for users, jobs, payments, messaging, and more

**Optional External Services (for full functionality):**
- **File Storage (Supabase)**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Email (Resend)**: `RESEND_API_KEY`
- **Payments (M-Pesa)**: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`
- **Payments (Paystack)**: `PAYSTACK_SECRET_KEY`
- **Other**: `CRON_SECRET` (random secret for cron jobs)

### Quick Start
1. ✅ PostgreSQL database created automatically
2. ✅ All tables initialized with `bun run db:push`
3. Application is ready to use!

To add optional features later, add credentials through Replit Secrets panel.

### Running the Application
```bash
bun run dev
```

The application runs on port 5000 and is configured to work with Replit's proxy system.

## Database Management
```bash
# Push schema changes
bun run db:push

# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Setup database (run once)
bun run setup-db
```

## Recent Changes
- **2024-11-21**: ✅ FULLY REPLIT-NATIVE SETUP COMPLETE
  - PostgreSQL database created automatically with Replit Database tool
  - All 40+ database tables initialized with Drizzle migrations
  - Converted from Turso (SQLite) to Replit PostgreSQL
  - App is ready to use with zero external database dependencies!
- **2024-11-21**: Updated React and dependencies for deployment
  - Upgraded React from v18.3.1 to v19.2.0 (required for @react-three/drei)
  - Upgraded React-DOM from v18.3.1 to v19.2.0
  - Upgraded better-auth from v1.3.10 to v1.3.34 (required for autumn-js)
  - Updated TypeScript type declarations to match React v19
  - ✅ Build tested successfully - deployment ready
- **2024-11**: Imported to Replit, configured for Replit environment
  - Configured Next.js to run on port 5000 with host 0.0.0.0
  - Set up webpack watch options for better file watching in Replit
  - Configured for Replit's iframe proxy (allowedHosts)

## Deployment Notes
- Frontend runs on port 5000 (required for Replit)
- Application is configured to handle Replit's iframe proxy
- All external services (Turso, Supabase, Resend, etc.) are cloud-based
- No local database or backend server needed
