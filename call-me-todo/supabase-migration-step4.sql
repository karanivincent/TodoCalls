-- Step 4: Add default projects for existing users (optional)
-- Run this after Step 3 completes successfully
-- This will create default projects for users who already exist

-- Add some default projects for existing users (optional)
-- This will create default projects for users who already exist
INSERT INTO projects (user_id, name, color, description) 
SELECT DISTINCT
  user_id,
  'Personal' as name,
  '#8b5cf6' as color,
  'Personal tasks and reminders' as description
FROM tasks
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = tasks.user_id AND p.name = 'Personal'
);

INSERT INTO projects (user_id, name, color, description) 
SELECT DISTINCT
  user_id,
  'Work' as name,
  '#3b82f6' as color,
  'Work-related tasks and projects' as description
FROM tasks
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = tasks.user_id AND p.name = 'Work'
);

INSERT INTO projects (user_id, name, color, description) 
SELECT DISTINCT
  user_id,
  'Family' as name,
  '#ec4899' as color,
  'Family care and responsibilities' as description
FROM tasks
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = tasks.user_id AND p.name = 'Family'
);

-- Summary of migration completed
-- Comment to document what we've done:
-- ✅ Created projects table with RLS policies
-- ✅ Enhanced tasks table with new columns (description, due_date, priority, tags, project_id, etc.)
-- ✅ Added indexes for performance
-- ✅ Created helper functions for project statistics
-- ✅ Added default projects for existing users
-- ✅ Set up triggers for automatic timestamp updates