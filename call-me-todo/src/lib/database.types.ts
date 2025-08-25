export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          phone_number: string;
          scheduled_at: string;
          status: 'pending' | 'completed' | 'snoozed' | 'failed';
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          notify_by_phone?: boolean;
          notify_by_text?: boolean;
          notify_by_email?: boolean;
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
          tags?: string[] | null;
          project_id?: string | null;
          due_date?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          phone_number: string;
          scheduled_at: string;
          status?: 'pending' | 'completed' | 'snoozed' | 'failed';
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          notify_by_phone?: boolean;
          notify_by_text?: boolean;
          notify_by_email?: boolean;
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
          tags?: string[] | null;
          project_id?: string | null;
          due_date?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          phone_number?: string;
          scheduled_at?: string;
          status?: 'pending' | 'completed' | 'snoozed' | 'failed';
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          notify_by_phone?: boolean;
          notify_by_text?: boolean;
          notify_by_email?: boolean;
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
          tags?: string[] | null;
          project_id?: string | null;
          due_date?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};