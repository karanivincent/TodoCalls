import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Database } from './database.types';

export function createSupabaseClient() {
	// Try multiple ways to get env vars
	let supabaseUrl = env.PUBLIC_SUPABASE_URL;
	let supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;
	
	// Fallback to process.env
	if (!supabaseUrl && typeof process !== 'undefined') {
		supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
	}
	if (!supabaseAnonKey && typeof process !== 'undefined') {
		supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
	}
	
	// Fallback to import.meta.env for Vite/browser
	if (!supabaseUrl && typeof import.meta !== 'undefined' && import.meta.env) {
		supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
	}
	if (!supabaseAnonKey && typeof import.meta !== 'undefined' && import.meta.env) {
		supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
	}
	
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Supabase environment variables not configured');
		console.error('URL found:', !!supabaseUrl, 'Key found:', !!supabaseAnonKey);
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