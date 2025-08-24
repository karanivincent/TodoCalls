-- Enhanced Schema Migration for TodoCalls
-- This script adds the foundation features: projects, priorities, descriptions, tags, etc.

-- First, let's create the projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
  description TEXT,
  color TEXT DEFAULT '#6366f1' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_archived_idx ON projects(user_id, is_archived);

-- Now enhance the tasks table
-- Add new columns to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER; -- in minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_duration INTEGER; -- in minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS energy_level VARCHAR(10) CHECK (energy_level IN ('low', 'medium', 'high'));

-- Add new status options to existing enum (if your DB supports it, otherwise we'll handle in app)
-- Note: Supabase/PostgreSQL doesn't easily allow ALTER TYPE, so we'll validate in the application layer

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_parent_task_id_idx ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_status_scheduled_idx ON tasks(user_id, status, scheduled_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update projects.updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some default projects for existing users (optional)
-- This will create default projects for users who already exist
INSERT INTO projects (user_id, name, color, description) 
SELECT 
  id as user_id,
  'Personal' as name,
  '#8b5cf6' as color,
  'Personal tasks and reminders' as description
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = auth.users.id AND p.name = 'Personal'
);

INSERT INTO projects (user_id, name, color, description) 
SELECT 
  id as user_id,
  'Work' as name,
  '#3b82f6' as color,
  'Work-related tasks and projects' as description
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = auth.users.id AND p.name = 'Work'
);

INSERT INTO projects (user_id, name, color, description) 
SELECT 
  id as user_id,
  'Family' as name,
  '#ec4899' as color,
  'Family care and responsibilities' as description
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = auth.users.id AND p.name = 'Family'
);

-- Create a view for task statistics per project
CREATE OR REPLACE VIEW project_task_stats AS
SELECT 
  p.id as project_id,
  p.user_id,
  p.name as project_name,
  p.color as project_color,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'pending' AND t.scheduled_at < NOW() THEN 1 END) as overdue_tasks
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
WHERE p.is_archived = FALSE
GROUP BY p.id, p.user_id, p.name, p.color;

-- Grant access to the view
GRANT SELECT ON project_task_stats TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view their own project stats" ON project_task_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Function to get user's project with task counts
CREATE OR REPLACE FUNCTION get_user_projects_with_counts(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  color TEXT,
  is_archived BOOLEAN,
  total_tasks BIGINT,
  pending_tasks BIGINT,
  completed_tasks BIGINT,
  overdue_tasks BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.color,
    p.is_archived,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'pending' AND t.scheduled_at < NOW() THEN 1 END) as overdue_tasks,
    p.created_at
  FROM projects p
  LEFT JOIN tasks t ON t.project_id = p.id
  WHERE p.user_id = user_uuid AND p.is_archived = FALSE
  GROUP BY p.id, p.name, p.description, p.color, p.is_archived, p.created_at
  ORDER BY p.created_at ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_projects_with_counts TO authenticated;

-- Create a function to automatically create default projects for new users
CREATE OR REPLACE FUNCTION create_default_projects_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default projects for the new user
  INSERT INTO projects (user_id, name, color, description) VALUES
    (NEW.id, 'Personal', '#8b5cf6', 'Personal tasks and reminders'),
    (NEW.id, 'Work', '#3b82f6', 'Work-related tasks and projects'),
    (NEW.id, 'Family', '#ec4899', 'Family care and responsibilities');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create projects for new users
-- Note: This might need adjustment based on your Supabase auth setup
-- CREATE TRIGGER create_user_default_projects
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION create_default_projects_for_user();

-- Add comment to document the schema
COMMENT ON TABLE projects IS 'User projects for organizing tasks';
COMMENT ON TABLE tasks IS 'Enhanced tasks table with projects, priorities, and more features';

-- Summary of changes:
-- ✅ Created projects table with RLS
-- ✅ Added enhanced fields to tasks table
-- ✅ Created indexes for performance
-- ✅ Added project statistics view
-- ✅ Created helper functions
-- ✅ Set up default projects for existing users
-- ✅ Prepared auto-creation of projects for new users