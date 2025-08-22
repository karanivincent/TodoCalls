-- Add 'calling' status to tasks table and new tracking columns
-- This migration handles both enum and check constraint scenarios

-- First, add the new columns for tracking call attempts
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS last_call_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Check if there's a check constraint on the status column and update it
-- This will work whether it's called task_status_check or tasks_status_check
DO $$ 
BEGIN
  -- Drop the existing check constraint if it exists
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS task_status_check;
  
  -- Add a new check constraint with all status values including 'calling'
  ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pending', 'completed', 'snoozed', 'failed', 'calling'));
  
EXCEPTION
  WHEN others THEN
    -- If there's any error, try the enum approach
    BEGIN
      -- Try to modify the enum if it exists
      ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'calling' AFTER 'pending';
    EXCEPTION
      WHEN others THEN
        -- If both approaches fail, log a notice
        RAISE NOTICE 'Could not add calling status - may already exist or using different schema';
    END;
END $$;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_status_scheduled 
ON tasks(status, scheduled_at) 
WHERE status IN ('pending', 'calling');

-- Update any existing 'calling' tasks back to pending (cleanup)
-- This is safe even if 'calling' status doesn't exist yet
UPDATE tasks 
SET status = 'pending' 
WHERE status = 'calling' 
AND updated_at < NOW() - INTERVAL '5 minutes';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('status', 'last_call_attempt', 'retry_count');

-- Show current constraint definition
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'tasks'::regclass
AND contype = 'c';