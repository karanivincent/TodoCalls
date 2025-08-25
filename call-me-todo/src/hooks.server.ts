import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	
	// Allow Twilio webhooks to bypass all security checks
	// These endpoints must be publicly accessible for Twilio
	if (pathname.startsWith('/api/voice/')) {
		// Log webhook requests for debugging
		console.log(`[Twilio Webhook] ${event.request.method} ${pathname}`);
		console.log('Headers:', Object.fromEntries(event.request.headers));
		
		// Mark as public endpoint
		event.locals.skipAuth = true;
		event.locals.publicEndpoint = true;
		
		// Process the request
		const response = await resolve(event);
		
		// Add CORS headers for public access
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Twilio-Signature');
		response.headers.set('X-Robots-Tag', 'noindex');
		
		return response;
	}
	
	// Try multiple ways to get env vars for Vercel compatibility
	let supabaseUrl = env.PUBLIC_SUPABASE_URL;
	let supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;
	
	// Fallback to process.env
	if (!supabaseUrl && typeof process !== 'undefined') {
		supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
	}
	if (!supabaseAnonKey && typeof process !== 'undefined') {
		supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
	}
	
	// Fallback to import.meta.env for Vite
	if (!supabaseUrl && typeof import.meta !== 'undefined' && import.meta.env) {
		supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
	}
	if (!supabaseAnonKey && typeof import.meta !== 'undefined' && import.meta.env) {
		supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
	}
	
	// Log what we found for debugging
	console.log('Supabase URL found:', !!supabaseUrl);
	console.log('Supabase Anon Key found:', !!supabaseAnonKey);
	
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Supabase environment variables not found in any location');
		console.error('Checked: env, process.env, import.meta.env');
		// Return a minimal response instead of crashing
		return new Response('Service temporarily unavailable - environment not configured', { 
			status: 503,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
	
	// Create Supabase client for all requests
	event.locals.supabase = createServerClient(
		supabaseUrl,
		supabaseAnonKey,
		{
			cookies: {
				getAll() {
					return event.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { 
							...options,
							path: '/',
							// Ensure proper cookie settings for production
							secure: true,
							sameSite: 'lax',
							httpOnly: true
						});
					});
				}
			}
		}
	);
	
	// Helper to get session
	event.locals.safeGetSession = async () => {
		const { data: { session } } = await event.locals.supabase.auth.getSession();
		return session;
	};
	
	// For all other requests, proceed normally
	return await resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Preserve Supabase auth cookies
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};