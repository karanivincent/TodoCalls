import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Allow public access for Twilio webhooks - no auth required
// Twilio may use GET for validation
export const GET: RequestHandler = async () => {
	return text('OK', { 
		status: 200,
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'no-cache'
		}
	});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
	
	// Log call status updates for debugging
	const callSid = formData.get('CallSid');
	const callStatus = formData.get('CallStatus');
	const from = formData.get('From');
	const to = formData.get('To');
	const duration = formData.get('CallDuration');
	
	console.log(`Call Status Update:`, {
		callSid,
		callStatus,
		from,
		to,
		duration
	});
	
		// Return 200 OK to acknowledge receipt
		return text('OK', { status: 200 });
	} catch (error: any) {
		console.error('Status webhook error:', error);
		// Always return 200 to prevent Twilio retries
		return text('OK', { status: 200 });
	}
};