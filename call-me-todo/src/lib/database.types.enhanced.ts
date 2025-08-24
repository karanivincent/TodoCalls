// Enhanced database types for TodoCalls with projects, priorities, and advanced features
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'snoozed' | 'failed';
export type EnergyLevel = 'low' | 'medium' | 'high';

export type RecurrencePattern = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;  // every N days/weeks/months
  days_of_week?: number[];  // for weekly [0=Sunday, 1=Monday, etc.]
  day_of_month?: number;    // for monthly
  end_date?: string;
  max_occurrences?: number;
};

export type PhoneReminderSettings = {
  enabled: boolean;
  phone_number?: string;
  voice_enabled?: boolean;
  text_enabled?: boolean;
  email_enabled?: boolean;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          phone_number: string;
          scheduled_at: string;
          due_date: string | null;
          status: TaskStatus;
          priority: Priority;
          tags: string[];
          project_id: string | null;
          parent_task_id: string | null;
          recurrence_pattern: RecurrencePattern | null;
          estimated_duration: number | null; // minutes
          actual_duration: number | null; // minutes
          energy_level: EnergyLevel | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          // Legacy phone reminder fields (maintained for compatibility)
          notify_by_phone?: boolean;
          notify_by_text?: boolean;
          notify_by_email?: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          phone_number: string;
          scheduled_at: string;
          due_date?: string | null;
          status?: TaskStatus;
          priority?: Priority;
          tags?: string[];
          project_id?: string | null;
          parent_task_id?: string | null;
          recurrence_pattern?: RecurrencePattern | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          energy_level?: EnergyLevel | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          notify_by_phone?: boolean;
          notify_by_text?: boolean;
          notify_by_email?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          phone_number?: string;
          scheduled_at?: string;
          due_date?: string | null;
          status?: TaskStatus;
          priority?: Priority;
          tags?: string[];
          project_id?: string | null;
          parent_task_id?: string | null;
          recurrence_pattern?: RecurrencePattern | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          energy_level?: EnergyLevel | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          notify_by_phone?: boolean;
          notify_by_text?: boolean;
          notify_by_email?: boolean;
        };
      };
    };
    Views: {
      project_task_stats: {
        Row: {
          project_id: string;
          user_id: string;
          project_name: string;
          project_color: string;
          total_tasks: number;
          pending_tasks: number;
          completed_tasks: number;
          overdue_tasks: number;
        };
      };
    };
    Functions: {
      get_user_projects_with_counts: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          is_archived: boolean;
          total_tasks: number;
          pending_tasks: number;
          completed_tasks: number;
          overdue_tasks: number;
          created_at: string;
        }[];
      };
    };
    Enums: {
      task_status: TaskStatus;
      priority_level: Priority;
      energy_level: EnergyLevel;
    };
  };
};

// Enhanced types for application use
export type EnhancedTask = Database['public']['Tables']['tasks']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectWithStats = Database['public']['Functions']['get_user_projects_with_counts']['Returns'][0];

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

// Task creation/update helpers
export type TaskCreate = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
export type ProjectCreate = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

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