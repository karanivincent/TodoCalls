import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Allow Twilio webhooks to bypass all authentication
	// These endpoints must be publicly accessible for Twilio
	const pathname = event.url.pathname;
	
	// Check if this is a Twilio webhook endpoint
	if (pathname.startsWith('/api/voice/')) {
		// Log webhook requests for debugging
		console.log(`[Twilio Webhook] ${event.request.method} ${pathname}`);
		
		// Set headers to ensure public access
		event.locals.skipAuth = true;
		
		// Process the request without any authentication
		const response = await resolve(event, {
			transformPageChunk: ({ html }) => html
		});
		
		// Add CORS headers for public access
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
		
		return response;
	}
	
	// For all other requests, proceed normally
	return await resolve(event);
};