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
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};