import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Allow Twilio webhooks to bypass authentication
	// These endpoints need to be publicly accessible for Twilio to call them
	const publicPaths = [
		'/api/voice/incoming',
		'/api/voice/outbound',
		'/api/voice/test-call',
		'/api/voice/handle-response',
		'/api/voice/status',
		'/api/voice/fallback'
	];
	
	// Check if the request is to a public webhook endpoint
	const isPublicWebhook = publicPaths.some(path => event.url.pathname.startsWith(path));
	
	if (isPublicWebhook) {
		// Log webhook requests for debugging
		console.log(`Webhook request: ${event.request.method} ${event.url.pathname}`);
		
		// For Twilio webhooks, we need to handle both POST and GET
		// and return appropriate responses without authentication
		return await resolve(event);
	}
	
	// For all other requests, proceed normally
	return await resolve(event);
};