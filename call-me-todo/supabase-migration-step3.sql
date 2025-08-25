-- Step 3: Add indexes, functions, and default data
-- Run this after Step 2 completes successfully

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_archived_idx ON projects(user_id, is_archived);
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