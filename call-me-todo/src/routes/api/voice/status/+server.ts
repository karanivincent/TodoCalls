import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	console.log('Status webhook POST request');
	
	// Parse form data from Twilio
	const formData = await request.formData();
	const body: any = {};
	for (const [key, value] of formData) {
		body[key] = value;
	}
	
	// Log the call status update
	console.log('Call Status Update:', {
		CallSid: body.CallSid,
		CallStatus: body.CallStatus,
		CallDuration: body.CallDuration,
		From: body.From,
		To: body.To,
		TaskId: body.taskId,
		Timestamp: new Date().toISOString()
	});
	
	// Log any errors from Twilio
	if (body.ErrorCode) {
		console.error('Call Error:', {
			ErrorCode: body.ErrorCode,
			ErrorMessage: body.ErrorMessage,
			CallSid: body.CallSid
		});
	}
	
	// Return 200 OK - Twilio expects this
	return new Response('OK', {
		status: 200,
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'no-cache'
		}
	});
};

// Handle OPTIONS for CORS
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature'
		}
	});
};

// Handle GET for testing
export const GET: RequestHandler = async () => {
	return new Response('Status webhook is working', {
		status: 200,
		headers: {
			'Content-Type': 'text/plain'
		}
	});
};