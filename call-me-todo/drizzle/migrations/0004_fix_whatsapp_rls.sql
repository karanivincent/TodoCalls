-- Fix RLS policies for WhatsApp task creation
-- This allows the service role to create tasks for WhatsApp users

-- First, let's check and update the tasks RLS policy
-- Enable RLS on tasks table if not already enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Service role has full access" ON tasks;

-- Create new policies that work with WhatsApp integration
-- Service role bypass (for WhatsApp webhook and other backend services)
CREATE POLICY "Service role has full access" ON tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view their own tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    auth.uid() IN (
      SELECT user_id FROM phone_numbers 
      WHERE phone_number = tasks.phone_number 
      AND is_whatsapp_primary = true
    )
  );

-- Authenticated users can create their own tasks
CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT user_id FROM phone_numbers 
      WHERE phone_number = tasks.phone_number 
      AND is_whatsapp_primary = true
    )
  );

-- Authenticated users can update their own tasks
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT user_id FROM phone_numbers 
      WHERE phone_number = tasks.phone_number 
      AND is_whatsapp_primary = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT user_id FROM phone_numbers 
      WHERE phone_number = tasks.phone_number 
      AND is_whatsapp_primary = true
    )
  );

-- Authenticated users can delete their own tasks
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT user_id FROM phone_numbers 
      WHERE phone_number = tasks.phone_number 
      AND is_whatsapp_primary = true
    )
  );

-- Anonymous/Public access for WhatsApp webhook (using anon key)
-- This is what the webhook uses when creating tasks
CREATE POLICY "Anon can create tasks via WhatsApp" ON tasks
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Only allow if source is whatsapp
    source = 'whatsapp'
  );

CREATE POLICY "Anon can view WhatsApp tasks" ON tasks
  FOR SELECT
  TO anon
  USING (
    -- Only allow viewing WhatsApp-sourced tasks
    source = 'whatsapp'
  );

-- Add source column if it doesn't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web' 
CHECK (source IN ('web', 'whatsapp', 'api', 'voice'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_phone_number ON tasks(phone_number);

-- Grant necessary permissions
GRANT ALL ON tasks TO service_role;
GRANT SELECT, INSERT ON tasks TO anon;
GRANT ALL ON tasks TO authenticated;