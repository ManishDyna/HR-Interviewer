-- Migration: Add password_hash to existing "user" table for custom authentication
-- Run this in your Supabase SQL Editor

-- Add password_hash column to existing user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for faster login lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
