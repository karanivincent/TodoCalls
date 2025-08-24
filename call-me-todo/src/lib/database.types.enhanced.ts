// Enhanced database types using Drizzle ORM
import type { 
  Task, 
  NewTask, 
  Project, 
  NewProject, 
  UserProfile, 
  PhoneNumber,
  Priority,
  TaskStatus,
  EnergyLevel,
  RecurrencePattern 
} from '$lib/db';

// Re-export Drizzle types for consistency
export type { 
  Task, 
  NewTask, 
  Project, 
  NewProject, 
  UserProfile, 
  PhoneNumber,
  Priority,
  TaskStatus,
  EnergyLevel,
  RecurrencePattern 
};

// Enhanced types for application use
export type EnhancedTask = Task;

export type ProjectWithStats = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_archived: boolean;
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  created_at: Date;
};

// Helper types for UI components
export type TaskWithProject = EnhancedTask & {
  project?: Project;
  sub_tasks?: EnhancedTask[];
};

export type ProjectWithTasks = Project & {
  tasks: EnhancedTask[];
  task_counts: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  };
};

// Task creation/update helpers (using Drizzle types)
export type TaskCreate = NewTask;
export type TaskUpdate = Partial<Task>;
export type ProjectCreate = NewProject;
export type ProjectUpdate = Partial<Project>;

// Common filter and sort types
export type TaskFilter = {
  status?: TaskStatus[];
  priority?: Priority[];
  project_id?: string;
  tags?: string[];
  due_date_range?: {
    start: string;
    end: string;
  };
  has_subtasks?: boolean;
};

export type TaskSort = {
  field: 'created_at' | 'scheduled_at' | 'due_date' | 'priority' | 'title';
  direction: 'asc' | 'desc';
};

// View configuration types
export type ViewType = 'today' | 'timeline' | 'list' | 'kanban' | 'calendar';

export type ViewConfig = {
  id: string;
  name: string;
  type: ViewType;
  filters: TaskFilter;
  sort: TaskSort[];
  group_by?: 'project' | 'priority' | 'status' | 'due_date';
};