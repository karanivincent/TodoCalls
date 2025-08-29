import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { Database } from './database.types';

/**
 * Creates a Supabase client with service role privileges
 * This bypasses RLS and should only be used in server-side code
 */
export function createServiceSupabaseClient() {
  // Get environment variables - try multiple sources
  const supabaseUrl = env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Creating service client - URL found:', !!supabaseUrl, 'Service key found:', !!supabaseServiceKey);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase service role configuration missing');
    console.error('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.error('Service key:', supabaseServiceKey ? 'Found' : 'Missing');
    
    // Fallback to anon key with warning
    const anonKey = env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && anonKey) {
      console.warn('⚠️ FALLING BACK TO ANON KEY - Tasks may fail due to RLS');
      return createClient<Database>(supabaseUrl, anonKey);
    }
    
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