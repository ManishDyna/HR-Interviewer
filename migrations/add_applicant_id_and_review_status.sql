-- Migration: Add applicant_id and review_status columns to interview_assignee table
-- This migration adds automatic applicant ID generation and review status tracking

-- Add applicant_id column (nullable initially, will be populated for new records)
ALTER TABLE interview_assignee 
ADD COLUMN IF NOT EXISTS applicant_id TEXT UNIQUE;

-- Add review_status column with CHECK constraint
ALTER TABLE interview_assignee 
ADD COLUMN IF NOT EXISTS review_status TEXT 
CHECK (review_status IN ('NO_STATUS', 'NOT_SELECTED', 'POTENTIAL', 'SELECTED'));

-- Set default value for review_status
ALTER TABLE interview_assignee 
ALTER COLUMN review_status SET DEFAULT 'NO_STATUS';

-- Create index on applicant_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_assignee_applicant_id ON interview_assignee(applicant_id);

-- Create index on review_status for filtering
CREATE INDEX IF NOT EXISTS idx_interview_assignee_review_status ON interview_assignee(review_status);

-- Create a function to generate applicant IDs
-- Format: APP-YYYYMMDD-XXXXX (where XXXXX is a 5-digit sequential number)
CREATE OR REPLACE FUNCTION generate_applicant_id()
RETURNS TEXT AS $$
DECLARE
    date_prefix TEXT;
    sequence_num INTEGER;
    new_applicant_id TEXT;
BEGIN
    -- Get date prefix (YYYYMMDD)
    date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get the highest sequence number for today's date
    SELECT COALESCE(MAX(CAST(SUBSTRING(applicant_id FROM 14) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM interview_assignee
    WHERE applicant_id LIKE 'APP-' || date_prefix || '-%';
    
    -- Generate new applicant ID
    new_applicant_id := 'APP-' || date_prefix || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN new_applicant_id;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate applicant_id on insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_applicant_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if applicant_id is NULL or empty
    IF NEW.applicant_id IS NULL OR NEW.applicant_id = '' THEN
        NEW.applicant_id := generate_applicant_id();
    END IF;
    
    -- Set default review_status if not provided
    IF NEW.review_status IS NULL THEN
        NEW.review_status := 'NO_STATUS';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_applicant_id ON interview_assignee;
CREATE TRIGGER trigger_auto_generate_applicant_id
    BEFORE INSERT ON interview_assignee
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_applicant_id();

-- Optional: Backfill existing records with applicant IDs (if needed)
-- Uncomment the following if you want to generate IDs for existing records
/*
UPDATE interview_assignee
SET applicant_id = generate_applicant_id()
WHERE applicant_id IS NULL OR applicant_id = '';
*/

