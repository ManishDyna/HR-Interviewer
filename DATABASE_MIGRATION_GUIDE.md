# Database Migration Guide: Applicant ID and Review Status

This guide explains the database changes needed to support automatic Applicant ID generation and Review Status tracking.

## Migration File

Run the migration file: `migrations/add_applicant_id_and_review_status.sql`

## What This Migration Does

### 1. Adds New Columns

- **`applicant_id`** (TEXT, UNIQUE)
  - Automatically generated unique identifier for each applicant
  - Format: `APP-YYYYMMDD-XXXXX` (e.g., `APP-20241215-00001`)
  - Generated automatically by database trigger

- **`review_status`** (TEXT)
  - Tracks the review status of the applicant
  - Values: `NO_STATUS`, `NOT_SELECTED`, `POTENTIAL`, `SELECTED`
  - Default: `NO_STATUS`
  - Synced with `candidate_status` in the `response` table

### 2. Creates Database Functions

- **`generate_applicant_id()`**
  - Generates a unique applicant ID based on current date and sequence number
  - Format: `APP-YYYYMMDD-XXXXX`
  - Ensures uniqueness per day

- **`auto_generate_applicant_id()`**
  - Trigger function that automatically generates applicant_id on INSERT
  - Only generates if applicant_id is NULL or empty
  - Sets default review_status if not provided

### 3. Creates Indexes

- `idx_interview_assignee_applicant_id` - For fast lookups by applicant ID
- `idx_interview_assignee_review_status` - For filtering by review status

### 4. Creates Trigger

- `trigger_auto_generate_applicant_id`
  - Automatically generates applicant_id when a new assignee is created
  - Sets default review_status if not provided

## How to Apply the Migration

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/add_applicant_id_and_review_status.sql`
4. Click "Run" to execute the migration

### Option 2: Using psql Command Line

```bash
psql -h your-db-host -U your-username -d your-database -f migrations/add_applicant_id_and_review_status.sql
```

### Option 3: Using Supabase CLI

```bash
supabase db push
```

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'interview_assignee'
AND column_name IN ('applicant_id', 'review_status');

-- Check if indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename = 'interview_assignee'
AND indexname IN ('idx_interview_assignee_applicant_id', 'idx_interview_assignee_review_status');

-- Test auto-generation
INSERT INTO interview_assignee (first_name, last_name, email, status)
VALUES ('Test', 'User', 'test@example.com', 'active')
RETURNING applicant_id, review_status;
```

## Backfilling Existing Records (Optional)

If you have existing records without applicant_id, you can backfill them:

```sql
-- Generate applicant IDs for existing records
UPDATE interview_assignee
SET applicant_id = generate_applicant_id()
WHERE applicant_id IS NULL OR applicant_id = '';
```

**Note:** This is commented out in the migration file. Uncomment if you want to backfill existing records.

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_applicant_id ON interview_assignee;

-- Drop function
DROP FUNCTION IF EXISTS auto_generate_applicant_id();
DROP FUNCTION IF EXISTS generate_applicant_id();

-- Drop indexes
DROP INDEX IF EXISTS idx_interview_assignee_applicant_id;
DROP INDEX IF EXISTS idx_interview_assignee_review_status;

-- Drop columns
ALTER TABLE interview_assignee DROP COLUMN IF EXISTS review_status;
ALTER TABLE interview_assignee DROP COLUMN IF EXISTS applicant_id;
```

## Important Notes

1. **Applicant ID Format**: The format is `APP-YYYYMMDD-XXXXX` where:
   - `APP` is the prefix
   - `YYYYMMDD` is the current date
   - `XXXXX` is a 5-digit sequential number (padded with zeros)

2. **Uniqueness**: The applicant_id is UNIQUE, so the database will prevent duplicates.

3. **Review Status Sync**: The review_status is automatically synced with candidate_status in the response table when you update the candidate status in the interview details page.

4. **Default Values**: 
   - New assignees will automatically get an applicant_id
   - New assignees will have review_status set to `NO_STATUS` by default

5. **Manual Override**: You can still manually set applicant_id if needed, but it's recommended to let the database auto-generate it.

## Testing

After migration, test the following:

1. **Create a new assignee** - Verify applicant_id is auto-generated
2. **Update review status** - Verify it syncs with candidate_status
3. **Filter by review status** - Verify the filter works in the UI
4. **Search by applicant_id** - Verify search functionality works

