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

### Required Environment Variables
The following environment variables must be configured:

**Database (Replit PostgreSQL):**
- `DATABASE_URL` - Automatically set when you create a database through Replit's Database tool

**File Storage (Supabase):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (required as secret)

**Email (Resend):**
- `RESEND_API_KEY` - Resend API key for sending emails (required as secret)

**Payments:**
- `MPESA_CONSUMER_KEY` - M-Pesa API consumer key (required as secret)
- `MPESA_CONSUMER_SECRET` - M-Pesa API consumer secret (required as secret)
- `MPESA_SHORTCODE` - M-Pesa business shortcode (required as secret)
- `MPESA_PASSKEY` - M-Pesa API passkey (required as secret)
- `MPESA_ENVIRONMENT` - 'sandbox' or 'production'
- `PAYSTACK_SECRET_KEY` - Paystack secret key (required as secret)
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Paystack public key

**Other:**
- `CRON_SECRET` - Random secret for cron job authentication (required as secret)
- `NEXT_PUBLIC_APP_URL` - Application base URL

**Setup Instructions:**
1. Create PostgreSQL database through Replit Database tool (see DATABASE_SETUP.md)
2. Provide required secrets through Replit Secrets panel
3. Run `bun run db:push` to create database tables

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
- **2024-11-21**: Migrated from Turso (SQLite) to Replit PostgreSQL database
  - Converted all database schemas from SQLite to PostgreSQL
  - Updated Drizzle ORM configuration to use @neondatabase/serverless
  - Changed data types: integer → serial for auto-increment, real → numeric, integer boolean → boolean
  - **Note**: Resend integration was dismissed by user - will use RESEND_API_KEY secret directly
- **2024-11-21**: Updated React and dependencies for deployment
  - Upgraded React from v18.3.1 to v19.2.0 (required for @react-three/drei)
  - Upgraded React-DOM from v18.3.1 to v19.2.0
  - Upgraded better-auth from v1.3.10 to v1.3.34 (required for autumn-js)
  - Updated TypeScript type declarations to match React v19
  - ✅ Build tested successfully - deployment ready
- **2024-11**: Imported to Replit, configured for Replit environment
  - Configured Next.js to run on port 5000 with host 0.0.0.0
  - Set up webpack watch options for better file watching in Replit

## Deployment Notes
- Frontend runs on port 5000 (required for Replit)
- Application is configured to handle Replit's iframe proxy
- All external services (Turso, Supabase, Resend, etc.) are cloud-based
- No local database or backend server needed
