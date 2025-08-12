-- Migration: Add interview_assignee table
-- This migration creates a new table for managing users who can be assigned interviews

-- Create interview assignee table for managing users who can be assigned interviews
CREATE TABLE IF NOT EXISTS interview_assignee (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    organization_id TEXT REFERENCES organization(id),
    interview_id TEXT REFERENCES interview(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    assigned_by TEXT REFERENCES "user"(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    notes TEXT
);

-- Create indexes for interview_assignee table
CREATE INDEX IF NOT EXISTS idx_interview_assignee_organization_id ON interview_assignee(organization_id);
CREATE INDEX IF NOT EXISTS idx_interview_assignee_interview_id ON interview_assignee(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_assignee_email ON interview_assignee(email);
CREATE INDEX IF NOT EXISTS idx_interview_assignee_status ON interview_assignee(status);

-- Create trigger to update updated_at timestamp for interview_assignee
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_interview_assignee_updated_at ON interview_assignee;
CREATE TRIGGER update_interview_assignee_updated_at BEFORE UPDATE ON interview_assignee
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data (optional)
-- INSERT INTO interview_assignee (first_name, last_name, email, organization_id, status) VALUES
-- ('John', 'Doe', 'john.doe@example.com', 'your-org-id', 'active'),
-- ('Jane', 'Smith', 'jane.smith@example.com', 'your-org-id', 'active'),
-- ('Bob', 'Johnson', 'bob.johnson@example.com', 'your-org-id', 'pending');
