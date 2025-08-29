import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { Database } from './database.types';

/**
 * Creates a Supabase client with service role privileges
 * This bypasses RLS and should only be used in server-side code
 */
export function createServiceSupabaseClient() {
  // Get environment variables
  const supabaseUrl = env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase service role configuration missing');
    throw new Error('Supabase service role key not configured');
  }
  
  // Create client with service role key
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}