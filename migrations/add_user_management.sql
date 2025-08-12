-- Migration: Add User Management Tables
-- This script adds user management functionality to the existing database

-- Create enum types for user roles and status
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'manager', 'interviewer', 'viewer');
CREATE TYPE IF NOT EXISTS user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- Update existing user table with new fields
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer',
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES "user"(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Make email required and unique if not already
ALTER TABLE "user" 
ALTER COLUMN email SET NOT NULL,
ADD CONSTRAINT IF NOT EXISTS user_email_unique UNIQUE (email);

-- Create user permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    granted BOOLEAN DEFAULT true,
    granted_by TEXT REFERENCES "user"(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id TEXT REFERENCES "user"(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_organization_id ON "user"(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_status ON "user"(status);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_updated_at ON "user";
CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "user"
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default permissions for existing users
INSERT INTO user_permissions (user_id, permission_name, granted)
SELECT id, 'view_interviews', true FROM "user"
ON CONFLICT DO NOTHING;

INSERT INTO user_permissions (user_id, permission_name, granted)
SELECT id, 'create_interviews', true FROM "user"
ON CONFLICT DO NOTHING;

-- Update existing users to have admin role if they don't have a role set
UPDATE "user" 
SET role = 'admin' 
WHERE role IS NULL;

-- Update existing users to have active status if they don't have a status set
UPDATE "user" 
SET status = 'active' 
WHERE status IS NULL;
