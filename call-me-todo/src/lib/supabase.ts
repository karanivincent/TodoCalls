import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Database } from './database.types';

export function createSupabaseClient() {
	if (isBrowser()) {
		return createBrowserClient<Database>(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
	}

	return createServerClient<Database>(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return [];
			},
			setAll() {}
		}
	});
}