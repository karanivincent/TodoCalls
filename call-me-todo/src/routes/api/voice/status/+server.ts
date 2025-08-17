import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
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
};