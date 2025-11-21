-- Add security columns to users table for account lockout
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
ALTER TABLE users ADD COLUMN last_failed_login TEXT;

-- Add rate limiting column to pending_registrations
ALTER TABLE pending_registrations ADD COLUMN last_code_sent TEXT;
