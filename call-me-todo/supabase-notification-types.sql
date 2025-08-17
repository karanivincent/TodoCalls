-- Add notification types to tasks table
-- Run this in your Supabase SQL Editor

-- Add columns for notification types if they don't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS notify_by_phone BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_by_text BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_by_email BOOLEAN DEFAULT false;

-- Update existing tasks to have phone notification enabled by default
UPDATE public.tasks 
SET notify_by_phone = true 
WHERE notify_by_phone IS NULL;

-- Add indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_notify_by_phone ON public.tasks(notify_by_phone);
CREATE INDEX IF NOT EXISTS idx_tasks_notify_by_text ON public.tasks(notify_by_text);
CREATE INDEX IF NOT EXISTS idx_tasks_notify_by_email ON public.tasks(notify_by_email);