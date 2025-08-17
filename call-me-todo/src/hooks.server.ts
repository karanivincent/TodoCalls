import type { Handle } from '@sveltejs/kit';

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
	
	// For all other requests, proceed normally
	return await resolve(event);
};