import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Database } from './database.types';

export function createSupabaseClient() {
	// Get env vars with fallback to process.env for Vercel
	const supabaseUrl = env.PUBLIC_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_URL : '');
	const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_ANON_KEY : '');
	
	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error('Supabase environment variables not configured');
	}
	
	if (isBrowser()) {
		return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
	}

	return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return [];
			},
			setAll() {}
		}
	});
}