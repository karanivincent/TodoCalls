import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/dashboard';
	const error = url.searchParams.get('error');
	const error_description = url.searchParams.get('error_description');

	console.log('[OAuth Server] Callback received:', {
		hasCode: !!code,
		hasError: !!error,
		next
	});

	// Handle OAuth errors
	if (error) {
		console.error('[OAuth Server] Error from provider:', error, error_description);
		throw redirect(303, `/auth?error=${encodeURIComponent(error_description || error)}`);
	}

	if (code) {
		// Exchange the code for a session using the Supabase client from hooks
		console.log('[OAuth Server] Exchanging code for session...');
		const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
		
		if (!exchangeError && data?.session) {
			console.log('[OAuth Server] Session created successfully, user:', data.session.user.email);
			// Successfully authenticated - redirect to dashboard
			throw redirect(303, next);
		} else if (exchangeError) {
			console.error('[OAuth Server] Exchange failed:', exchangeError);
			// Redirect to auth page with error
			throw redirect(303, `/auth?error=${encodeURIComponent(exchangeError.message)}`);
		}
	}

	// No code provided - let client-side handle it
	console.log('[OAuth Server] No code provided, returning empty response');
	return new Response(null, { status: 200 });
};