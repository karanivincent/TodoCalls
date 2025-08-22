/**
 * Utility functions for handling Twilio webhook requests safely
 */

/**
 * Safely parse request body from Twilio webhook
 * Twilio sends application/x-www-form-urlencoded data
 */
export async function parseTwilioRequest(request: Request): Promise<Record<string, any>> {
	const requestId = Math.random().toString(36).substring(7);
	const contentType = request.headers.get('content-type') || '';
	
	console.log(`[${requestId}] Parsing Twilio request:`, {
		method: request.method,
		url: request.url,
		contentType,
		headers: Object.fromEntries(request.headers.entries())
	});

	const body: Record<string, any> = {};

	try {
		if (contentType.includes('application/x-www-form-urlencoded')) {
			// Standard Twilio format
			const text = await request.text();
			const params = new URLSearchParams(text);
			for (const [key, value] of params) {
				body[key] = value;
			}
			console.log(`[${requestId}] Parsed URL-encoded body:`, body);
		} else if (contentType.includes('multipart/form-data')) {
			// Multipart form data (shouldn't happen with Twilio, but handle it)
			try {
				const formData = await request.formData();
				for (const [key, value] of formData) {
					body[key] = value;
				}
				console.log(`[${requestId}] Parsed multipart form data:`, body);
			} catch (formError) {
				console.error(`[${requestId}] Failed to parse multipart form:`, formError);
				// Return empty body rather than throwing
			}
		} else if (request.method === 'POST') {
			// Try to parse as text/urlencoded anyway (Twilio might not set Content-Type)
			try {
				const text = await request.text();
				if (text) {
					const params = new URLSearchParams(text);
					for (const [key, value] of params) {
						body[key] = value;
					}
					console.log(`[${requestId}] Parsed body without Content-Type:`, body);
				}
			} catch (textError) {
				console.error(`[${requestId}] Failed to parse request body:`, textError);
			}
		}
	} catch (error) {
		console.error(`[${requestId}] Error parsing Twilio request:`, error);
		// Return empty body rather than throwing
	}

	return body;
}

/**
 * Generate error TwiML response
 */
export function errorTwiML(message: string, includeSupport: boolean = false): string {
	const supportMessage = includeSupport ? ' Please contact support if this continues.' : '';
	return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}${supportMessage}</Say>
</Response>`;
}

/**
 * Log error with full context
 */
export function logError(context: string, error: any, additionalInfo?: Record<string, any>) {
	const errorInfo = {
		context,
		message: error?.message || 'Unknown error',
		stack: error?.stack,
		type: error?.constructor?.name || typeof error,
		timestamp: new Date().toISOString(),
		...additionalInfo
	};
	
	console.error('🚨 ERROR:', errorInfo);
	
	// Also log a simplified version for quick scanning
	console.error(`🚨 ${context}: ${error?.message || error}`);
}