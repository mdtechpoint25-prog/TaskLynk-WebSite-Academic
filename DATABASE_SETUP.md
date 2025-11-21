# Database Setup Instructions

## Step 1: Create Replit PostgreSQL Database

1. Look for the **Database** tool in the left sidebar of your Replit workspace
2. Click on it and select **"Create a database"**
3. This will automatically provision a PostgreSQL database and set up the `DATABASE_URL` environment variable

## Step 2: Run Database Migrations

Once the database is created, run the following command to create all tables:

```bash
bun run db:push
```

This will create all the necessary tables based on the schema defined in `src/db/schema.ts`.

## Step 3: (Optional) Seed Initial Data

If you have a database seeding script, run:

```bash
bun run setup-db
```

## Verification

After setting up, you can verify the database connection by:
1. Checking the Database tool in Replit - you should see all your tables
2. Visiting your application's diagnostic endpoint (if available)

## Important Notes

- The database is automatically backed up by Replit
- Connection credentials are managed automatically through environment variables
- You can view and edit data directly in the Database tool interface
- The database supports point-in-time restore for recovery

## What Changed from Turso?

Your application has been migrated from Turso (SQLite) to Replit's PostgreSQL database:
- ✅ All SQLite schemas converted to PostgreSQL
- ✅ Database client updated to use @neondatabase/serverless
- ✅ Drizzle ORM configuration updated
- ✅ All data types converted (integer → serial, real → numeric, etc.)

No changes to your API routes are needed - they will work with the new database automatically!
