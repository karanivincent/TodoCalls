import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { Database } from './database.types';

/**
 * Creates a Supabase client with the service role key that bypasses Row Level Security (RLS).
 * This should only be used in server-side code for system operations like cron jobs.
 * 
 * IMPORTANT: Never expose the service role key to the client side!
 */
export function createServiceSupabaseClient() {
	// Use service role key if available, otherwise fall back to anon key
	// The service role key bypasses all RLS policies
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.PUBLIC_SUPABASE_ANON_KEY;
	
	if (!env.SUPABASE_SERVICE_ROLE_KEY) {
		console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key. Cron jobs may not work properly!');
	}
	
	return createClient<Database>(
		env.PUBLIC_SUPABASE_URL,
		supabaseKey,
		{
			auth: {
				persistSession: false,
				autoRefreshToken: false
			}
		}
	);
}