import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Database } from './database.types';

/**
 * Creates a Supabase client with the service role key that bypasses Row Level Security (RLS).
 * This should only be used in server-side code for system operations like cron jobs.
 * 
 * IMPORTANT: Never expose the service role key to the client side!
 */
export function createServiceSupabaseClient() {
	// Get Supabase URL from public env
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	
	if (!supabaseUrl) {
		throw new Error('PUBLIC_SUPABASE_URL is not set in environment variables');
	}
	
	// Use service role key if available, otherwise fall back to anon key
	// The service role key bypasses all RLS policies
	const supabaseKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	
	if (!privateEnv.SUPABASE_SERVICE_ROLE_KEY) {
		console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key. Cron jobs may not work properly!');
	}
	
	if (!supabaseKey) {
		throw new Error('No Supabase key found (neither SERVICE_ROLE_KEY nor ANON_KEY)');
	}
	
	console.log('Creating service client with:', {
		hasUrl: !!supabaseUrl,
		hasServiceKey: !!privateEnv.SUPABASE_SERVICE_ROLE_KEY,
		usingAnonKey: !privateEnv.SUPABASE_SERVICE_ROLE_KEY
	});
	
	return createClient<Database>(
		supabaseUrl,
		supabaseKey,
		{
			auth: {
				persistSession: false,
				autoRefreshToken: false
			}
		}
	);
}