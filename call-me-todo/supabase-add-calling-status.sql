-- Add 'calling' status to tasks table
-- This is needed for the cron job to track tasks that are currently being called

-- First, check and add the status if it doesn't exist
DO $$ 
BEGIN
  -- Check if 'calling' value exists in the enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'calling' 
    AND enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'task_status'
    )
  ) THEN
    -- Add the new status value
    ALTER TYPE task_status ADD VALUE 'calling' AFTER 'pending';
  END IF;
END $$;

-- Add columns to track call attempts
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS last_call_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_status_scheduled 
ON tasks(status, scheduled_at) 
WHERE status IN ('pending', 'calling');

-- Update any stuck 'calling' tasks back to pending (cleanup)
UPDATE tasks 
SET status = 'pending' 
WHERE status = 'calling' 
AND updated_at < NOW() - INTERVAL '5 minutes';