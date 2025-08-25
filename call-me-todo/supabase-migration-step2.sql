-- Step 2: Add new columns to existing tasks table
-- Run this after Step 1 completes successfully

-- Add new columns to existing tasks table one by one
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER; -- in minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_duration INTEGER; -- in minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS energy_level VARCHAR(10) 
  CHECK (energy_level IN ('low', 'medium', 'high'));

-- Add foreign key constraints after columns are created
ALTER TABLE tasks 
  ADD CONSTRAINT fk_tasks_project_id 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE tasks 
  ADD CONSTRAINT fk_tasks_parent_task_id 
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;