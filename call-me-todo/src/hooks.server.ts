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
	
	// Get Supabase env vars with fallback to process.env for Vercel
	const supabaseUrl = env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
	
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Supabase environment variables not found');
		throw new Error('Supabase environment variables not configured');
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