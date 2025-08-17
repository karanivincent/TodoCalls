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
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};